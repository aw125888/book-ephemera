"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type ResultsScreenProps = {
  next: () => void;
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

type JobResponse = {
  status: string;
  title?: string;
  author?: string;
  cover_image?: string;
  goodreads_url?: string;
};

export default function ResultsScreen({ next }: ResultsScreenProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [goodreadsUrl, setGoodreadsUrl] = useState("");

  useEffect(() => {
    const jobId = localStorage.getItem("book-ephemera-job-id");
    if (!jobId) return;

    const loadJob = async () => {
      const response = await fetch(`${BACKEND_URL}/api/jobs/${jobId}`);
      if (!response.ok) return;

      const data: JobResponse = await response.json();

      if (data.title) setTitle(data.title);
      if (data.author) setAuthor(data.author);
      if (data.cover_image) setCoverImage(data.cover_image);
      if (data.goodreads_url) setGoodreadsUrl(data.goodreads_url);
    };

    loadJob();
  }, []);

  const coverSrc = coverImage
    ? coverImage.startsWith("http")
      ? coverImage
      : coverImage.startsWith("/")
        ? `${BACKEND_URL}${coverImage}`
        : `${BACKEND_URL}/covers/${coverImage}`
    : "";

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 h-full w-full object-cover"
      >
        <source src="/blueFishie.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 flex h-screen flex-col items-center justify-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute left-1/2 top-[clamp(20px,12vh,120px)] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-serif text-[clamp(2rem,4vw,3.25rem)] tracking-[-0.04em] text-gray-300"
        >
          Your Sentiment 2 Novel:
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-5 text-center"
        >
          {coverSrc ? (
            <div className="overflow-hidden rounded-2xl shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
              <img
                src={coverSrc}
                alt={title || "Book cover"}
                className="h-[clamp(260px,34vw,420px)] w-[clamp(180px,22vw,280px)] object-cover"
              />
            </div>
          ) : (
            <div className="flex h-[clamp(260px,34vw,420px)] w-[clamp(180px,22vw,280px)] items-center justify-center rounded-2xl border border-white/20 bg-white/5 text-white/60">
              No cover image
            </div>
          )}

          <div className="max-w-2xl">
            <div className="font-serif text-[clamp(1.75rem,4vw,3rem)] tracking-[-0.04em] text-gray-100">
              {title}
            </div>
            <div className="mt-2 font-sans text-[clamp(1rem,1.6vw,1.25rem)] italic text-gray-300/90">
              {author}
            </div>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onClick={next}
          className="fixed bottom-[clamp(20px,4vh,40px)] left-1/2 -translate-x-1/2 font-serif text-[clamp(1.75rem,3vw,2.25rem)] tracking-[-0.04em] text-gray-300 transition-transform duration-500 hover:translate-x-2"
        >
          Back →
        </motion.button>

        {goodreadsUrl && (
          <div className="mt-4 flex flex-col items-center gap-3">
            <button
              type="button"
              className="rounded-full border border-gray-300/40 bg-white/10 px-6 py-3 font-serif text-[clamp(1rem,1.6vw,1.25rem)] tracking-[-0.03em] text-gray-100 transition hover:bg-white/20"
              onClick={() =>
                window.open(goodreadsUrl, "_blank", "noopener,noreferrer")
              }
            >
              Add to Goodreads!
            </button>
          </div>
        )}
      </div>
    </main>
  );
}