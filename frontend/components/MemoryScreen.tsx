"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";

type UploadScreenTextProps = {
  next: () => void;
};

const MAX_WORDS = 50;
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function UploadScreenText({ next }: UploadScreenTextProps) {
  const [quote, setQuote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = useMemo(() => countWords(quote), [quote]);
  const canContinue = quote.trim().length > 0;

  const handleNext = async () => {
    if (!canContinue) return;

    setSaving(true);
    setError(null);

    try {
      const jobId = localStorage.getItem("book-ephemera-job-id");
      if (!jobId) {
        throw new Error("Missing job id.");
      }

      const response = await fetch(`${BACKEND_URL}/api/jobs/${jobId}/text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: quote.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save text");
      }

      next();
    } catch (err) {
      console.error(err);
      setError("Could not save your text.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 h-full w-full object-cover"
      >
        <source src="/CupcakeRise.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-black/15" />

      <div className="relative z-10 h-screen">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute left-1/2 top-[clamp(28px,12vh,100px)] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-serif text-[clamp(2.5rem,5vw,4.5rem)] tracking-[-0.04em] text-gray-400"
        >
          Finally, A Sentiment Please.
        </motion.h1>

        <p className="absolute left-1/2 top-[clamp(90px,20vh,180px)] -translate-x-1/2 whitespace-nowrap text-center font-serif text-[clamp(0.85rem,1.4vw,1rem)] italic tracking-wide text-gray-300">
          A Quote, A Lyric, A Memory...
          <br />
          Anything As Long As You Keep It Under 50 Words
        </p>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <textarea
            value={quote}
            onChange={(e) => {
              const words = e.target.value.trim().split(/\s+/).filter(Boolean);

              if (words.length <= MAX_WORDS) {
                setQuote(e.target.value);
              } else {
                setQuote(words.slice(0, MAX_WORDS).join(" "));
              }
            }}
            className="h-[clamp(8rem,18vw,10rem)] w-[clamp(18rem,45vw,24rem)] resize-none border-none bg-transparent text-center font-serif text-[clamp(1.25rem,2.2vw,1.5rem)] leading-[clamp(1.8rem,3vw,2rem)] text-gray-300 outline-none"
            placeholder="Write something."
          />

          <div className="mt-2 text-center font-mono text-[clamp(0.65rem,1vw,0.75rem)] text-gray-400">
            {wordCount}/{MAX_WORDS}
          </div>
        </div>

        {error && (
          <div className="absolute left-1/2 top-[clamp(60%,68vh,72%)] -translate-x-1/2 font-sans text-[clamp(0.75rem,1vw,0.875rem)] text-red-300">
            {error}
          </div>
        )}

        {canContinue && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onClick={handleNext}
            disabled={saving}
            className="fixed bottom-[clamp(20px,4vh,40px)] left-1/2 -translate-x-1/2 font-serif text-[clamp(1.75rem,3vw,2.25rem)] tracking-[-0.04em] text-gray-400 transition-transform duration-500 hover:translate-x-2 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Next →"}
          </motion.button>
        )}
      </div>
    </main>
  );
}