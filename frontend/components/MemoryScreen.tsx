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
          className="absolute left-1/2 top-[12%] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-serif text-6xl tracking-[-0.04em] text-gray-400"
        >
          Finally, A Sentiment Please.
        </motion.h1>

        <p className="absolute left-1/2 top-[20%] -translate-x-1/2 whitespace-nowrap text-center font-serif text-base italic tracking-wide text-gray-300">
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
            className="h-40 w-96 resize-none border-none bg-transparent text-center font-serif text-2xl leading-8 text-gray-300 outline-none"
            placeholder=""
          />

          <div className="mt-2 text-center font-mono text-xs text-gray-400">
            {wordCount}/{MAX_WORDS}
          </div>
        </div>

        {error && (
          <div className="absolute left-1/2 top-[68%] -translate-x-1/2 font-sans text-sm text-red-300">
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
            className="fixed bottom-10 left-1/2 -translate-x-1/2 font-serif text-4xl tracking-[-0.04em] text-gray-400 transition-transform duration-500 hover:translate-x-2 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Next →"}
          </motion.button>
        )}
      </div>
    </main>
  );
}