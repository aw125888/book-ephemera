"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const BACKEND_URL = "http://localhost:8000";
const JOB_KEY = "book-ephemera-job-id";

type JobStatus = "processing" | "ready" | "error" | "idle";

type JobResponse = {
  status: string;
  combined_text: string;
  images: string[];
};

type LoadingScreenProps = {
  next: () => void;
};

type SwirlWordsProps = {
  words: string[];
  jobStatus: JobStatus;
  elapsedMs: number;
  onNext: () => void;
  nextLabel?: string;
  bakingLabel?: string;
};

const SIZE_CLASSES = [
  "text-sm",
  "text-base",
  "text-lg",
  "text-xl",
  "text-2xl",
  "text-3xl",
  "text-4xl",
];

const COLOR_CLASSES = ["text-white", "text-sky-200", "text-violet-200"];

function shuffle<T>(items: T[]) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function shuffleNotSame<T>(items: T[]) {
  if (items.length <= 1) return [...items];

  let shuffled = shuffle(items);
  let attempts = 0;

  while (attempts < 10 && shuffled.every((item, index) => item === items[index])) {
    shuffled = shuffle(items);
    attempts += 1;
  }

  return shuffled;
}

function useViewport() {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const update = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return viewport;
}

function SwirlWords({
  words,
  jobStatus,
  elapsedMs,
  onNext,
  nextLabel = "Ready! →",
  bakingLabel = "Baking...Baking...",
}: SwirlWordsProps) {
  const viewport = useViewport();

  const shuffledWords = useMemo(() => shuffleNotSame(words), [words]);

  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    setRevealedCount(0);

    if (shuffledWords.length === 0) return;

    const startDelay = 5000;
    const stagger = 140;
    const timers: number[] = [];

    shuffledWords.forEach((_, index) => {
      timers.push(
        window.setTimeout(() => {
          setRevealedCount((current) => Math.max(current, index + 1));
        }, startDelay + index * stagger)
      );
    });

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [shuffledWords]);

  const showWords = jobStatus === "ready" && elapsedMs >= 5000;
  const nextEnabled = jobStatus === "ready" && elapsedMs >= 10000;

  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  const maxRadius = Math.min(viewport.width, viewport.height) * 0.34;
  const turns = 2.5;

  const swirlProgress =
    shuffledWords.length === 0 ? 1 : Math.max(0.12, revealedCount / shuffledWords.length);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <AnimatePresence mode="wait">
        {!showWords ? (
          <motion.div
            key="baking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-5xl italic text-white/80"
          >
            {bakingLabel}
          </motion.div>
        ) : (
          <motion.div
            key="swirl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {shuffledWords.map((word, index) => {
              const total = Math.max(1, shuffledWords.length - 1);
              const t = index / total;

              const angle = t * Math.PI * 2 * turns + index * 0.12;
              const radius = maxRadius * (0.06 + 0.94 * t) * swirlProgress;

              const x = centerX + Math.cos(angle) * radius;
              const y = centerY + Math.sin(angle) * radius;

              const sizeClass = SIZE_CLASSES[index % SIZE_CLASSES.length];
              const colorClass = COLOR_CLASSES[index % COLOR_CLASSES.length];
              const visible = index < revealedCount;

              return (
                <span
                  key={`${word}-${index}`}
                  className={`pointer-events-none absolute select-none whitespace-nowrap font-serif transition-all duration-700 ease-out ${sizeClass} ${colorClass} ${
                    visible ? "opacity-100" : "opacity-0"
                  }`}
                  style={{
                    left: x,
                    top: y,
                    transform: `translate(-50%, -50%) scale(${0.86 + swirlProgress * 0.22})`,
                    letterSpacing: "0.02em",
                    fontWeight: 300 + (index % 2) * 100,
                  }}
                >
                  {word}
                </span>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {jobStatus === "ready" && (
          <motion.button
            key="next"
            initial={{ opacity: 0 }}
            animate={{ opacity: nextEnabled ? 1 : 0.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            onClick={onNext}
            disabled={!nextEnabled}
            className={`fixed bottom-10 left-1/2 -translate-x-1/2 font-serif text-4xl tracking-[-0.04em] ${
              nextEnabled ? "text-white" : "cursor-not-allowed text-white/50"
            }`}
          >
            {nextLabel}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LoadingScreen({ next }: LoadingScreenProps) {
  const [combinedText, setCombinedText] = useState("");
  const [status, setStatus] = useState<JobStatus>("processing");
  const [images, setImages] = useState<string[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    setJobId(localStorage.getItem(JOB_KEY));
  }, []);

  useEffect(() => {
    let raf = 0;
    const startedAt = performance.now();

    const tick = () => {
      setElapsedMs(performance.now() - startedAt);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/jobs/${jobId}`);
        if (!response.ok) return;

        const data: JobResponse = await response.json();

        setStatus((data.status as JobStatus) || "processing");

        if (data.combined_text) {
          setCombinedText(data.combined_text);
        }

        if (Array.isArray(data.images)) {
          setImages(data.images);
        }
      } catch (err) {
        console.error(err);
      }
    };

    poll();
    const interval = window.setInterval(poll, 1000);

    return () => window.clearInterval(interval);
  }, [jobId]);

  const words = useMemo(() => {
    return combinedText.replace(/,/g, "").split(/\s+/).filter(Boolean);
  }, [combinedText]);

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 h-full w-full object-cover"
      >
        <source src="/swirlyBaby.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-black/20" />

      <div className="absolute inset-0 pointer-events-none">
        {images.map((image, index) => {
          const filename = image.split("/").pop();
          if (!filename || !jobId) return null;

          return (
            <motion.img
              key={image}
              src={`${BACKEND_URL}/uploads/${jobId}/${filename}`}
              initial={{
                opacity: 0,
                scale: 1.08,
              }}
              animate={{
                opacity: [0.08, 0.14, 0.08],
                scale: [1, 1.03, 1],
                y: [-8, 12, -8],
              }}
              transition={{
                opacity: {
                  duration: 8 + index * 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                scale: {
                  duration: 8 + index * 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                y: {
                  repeat: Infinity,
                  duration: 14 + index * 3,
                  ease: "easeInOut",
                },
              }}
              className="absolute rounded-xl object-cover"
              style={{
                width: 340,
                left: `${12 + index * 27}%`,
                top: `${18 + index * 18}%`,
                filter: "blur(3px) saturate(0.85)",
                mixBlendMode: "screen",
                transform: `rotate(${index === 0 ? -12 : index === 1 ? 8 : -5}deg)`,
              }}
            />
          );
        })}
      </div>

      <div className="absolute inset-0 overflow-hidden">
        <SwirlWords
          words={words}
          jobStatus={status}
          elapsedMs={elapsedMs}
          onNext={next}
        />
      </div>
    </main>
  );
}