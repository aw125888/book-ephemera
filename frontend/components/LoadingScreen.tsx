"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;
const JOB_KEY = "book-ephemera-job-id";

type JobStatus =
  | "collecting"
  | "processing"
  | "embedding"
  | "ready"
  | "error";

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
  onNext?: () => void;
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

// --- UPDATED ANIMATION CONFIGURATION ---
const BAKING_MS = 5000;          
const WORD_STAGGER_MS = 220;     
const START_RADIUS = 15;         
const SPIRAL_RADIUS_STEP = 14;   
const SPIRAL_ANGLE_STEP = 0.45;  
const DEPLOY_SPEED = 140;        
const WOBBLE_SIZE = 3;           
// ---------------------------------------

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
  onNext,
  nextLabel = "Press 2 Get Book",
  bakingLabel = "Baking...Baking...",
}: SwirlWordsProps) {
  const viewport = useViewport();
  
  // 1. Cut the text off at a strict maximum of 150 words
  const slicedWords = useMemo(() => {
    const shuffled = shuffleNotSame(words);
    return shuffled.slice(0, 150);
  }, [words]);

  const [elapsedMs, setElapsedMs] = useState(0);
  const [showReadyButton, setShowReadyButton] = useState(false);

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

  const visibleCount = useMemo(() => {
    if (elapsedMs < BAKING_MS) return 0;
    return Math.min(
      slicedWords.length,
      Math.floor((elapsedMs - BAKING_MS) / WORD_STAGGER_MS) + 1
    );
  }, [elapsedMs, slicedWords.length]);

  const allWordsOut = slicedWords.length > 0 && visibleCount >= slicedWords.length;

  // 2. Control transition: Trigger crossfade only when all 60 words are fully out AND backend status is "ready"
  useEffect(() => {
    if (allWordsOut && jobStatus === "ready") {
      const timer = setTimeout(() => {
        setShowReadyButton(true);
      }, 600); // Tiny holding pause on completion before fading
      return () => clearTimeout(timer);
    } else {
      setShowReadyButton(false);
    }
  }, [allWordsOut, jobStatus]);

  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  const maxAllowedRadius = Math.min(viewport.width, viewport.height) * 0.45;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Baking State Overlay */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1900 ${
          elapsedMs < BAKING_MS ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <span className="select-none font-serif text-3xl font-light uppercase tracking-[0.35em] text-white/40">
          {bakingLabel}
        </span>
      </div>

      {/* Swirling Words Wrapper - Smoothly dissolves completely out of view */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
        style={{ opacity: showReadyButton ? 0 : 1, pointerEvents: showReadyButton ? 'none' : 'auto' }}
      >
        {slicedWords.map((word, index) => {
          const revealAt = BAKING_MS + index * WORD_STAGGER_MS;
          const visible = elapsedMs >= revealAt;

          const ageMs = Math.max(0, elapsedMs - revealAt);
const ageSeconds = ageMs / 1000;

const radialGrowth = ageSeconds * DEPLOY_SPEED * 0.35; // slower outward motion
const wobble = Math.sin(ageSeconds * 3 + index * 0.5) * WOBBLE_SIZE;

const radius = START_RADIUS + radialGrowth + wobble;

// tighter coil = more angle per pixel of radius
const TIGHTNESS = 1.8;
const angle =
  (radius / SPIRAL_RADIUS_STEP) * SPIRAL_ANGLE_STEP * TIGHTNESS - Math.PI / 2;

          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;

          const sizeClass = SIZE_CLASSES[index % SIZE_CLASSES.length];
          const colorClass = COLOR_CLASSES[index % COLOR_CLASSES.length];

          return (
            <span
              key={`${word}-${index}`}
              className={`pointer-events-none absolute select-none whitespace-nowrap font-serif ${sizeClass} ${colorClass}`}
              style={{
                left: x,
                top: y,
                transform: `translate(-50%, -50%) scale(${visible ? 1 : 0.6})`,
                opacity: visible ? 1 : 0,
                transition: "opacity 400ms ease-out, transform 400ms ease-out",
                letterSpacing: "0.02em",
                fontWeight: 300 + (index % 2) * 100,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>

      {/* 3. Minimalist Centered White Serif Action Button Fade-in */}
      <AnimatePresence>
        {showReadyButton && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.button
            key="next"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            onClick={onNext}
            className="pointer-events-auto font-serif text-4xl tracking-[-0.04em] text-white transition-transform duration-500 hover:translate-x-2"
          >
            {nextLabel}
          </motion.button>
          </div>
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

  useEffect(() => {
    setJobId(localStorage.getItem(JOB_KEY));
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
        <source src="/someFrenchFire.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-black/20" />

      {/* Ambient background processing images */}
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
                  scale: 0.9,
                  filter: "blur(12px)",
                }}
              animate={{
                opacity: [0, 0.35, 0.18, 0.35],
                scale: [0.9, 1.02, 1],
                filter: ["blur(12px)", "blur(3px)", "blur(3px)"],
                y: [-8, 12, -8],
              }}
              transition={{
                delay: index * 0.7,
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
                // filter: "blur(3px) saturate(0.85)",
                mixBlendMode: "screen",
                transform: `rotate(${index === 0 ? -12 : index === 1 ? 8 : -5}deg)`,
              }}
            />
          );
        })}
      </div>

      <div className="absolute inset-0 overflow-hidden">
        <SwirlWords words={words} jobStatus={status} onNext={next} />
      </div>
    </main>
  );
}