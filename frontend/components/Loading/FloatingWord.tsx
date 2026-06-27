"use client";

import { useEffect, useMemo, useState } from "react";

type JobStatus = "idle" | "running" | "ready" | "error";

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

export default function SwirlWords({
  words,
  jobStatus,
  onNext,
  nextLabel = "Ready!",
  bakingLabel = "baking",
}: SwirlWordsProps) {
  const viewport = useViewport();

  const shuffledWords = useMemo(() => shuffleNotSame(words), [words]);

  const [elapsedMs, setElapsedMs] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);

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
    setRevealedCount(0);

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

  const bakingVisible = elapsedMs < 5000;
  const swirlProgress =
    shuffledWords.length === 0 ? 1 : Math.max(0.12, revealedCount / shuffledWords.length);

  const nextEnabled = jobStatus === "ready" && elapsedMs >= 10000;

  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  const maxRadius = Math.min(viewport.width, viewport.height) * 0.34;
  const turns = 2.5;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${
          bakingVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="select-none font-serif text-3xl font-light uppercase tracking-[0.35em] text-white/40">
          {bakingLabel}
        </span>
      </div>

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

      <button
        type="button"
        disabled={!nextEnabled}
        onClick={onNext}
        className={`absolute bottom-4 right-4 rounded-full px-4 py-2 text-sm font-medium transition ${
          nextEnabled
            ? "bg-white text-black hover:opacity-90"
            : "cursor-not-allowed bg-white/20 text-white/40"
        }`}
      >
        {nextLabel}
      </button>
    </div>
  );
}