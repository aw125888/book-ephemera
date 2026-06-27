"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type ResultsScreenProps = {
  next: () => void;
};

const BACKEND_URL = "http://localhost:8000";

type JobResponse = {
  status: string;
  title?: string;
  author?: string;
  cover_image?: string;
};

export default function ResultsScreen({ next }: ResultsScreenProps) {
  const [status, setStatus] = useState("processing");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverImage, setCoverImage] = useState("");

  useEffect(() => {
    const jobId = localStorage.getItem("book-ephemera-job-id");
    if (!jobId) return;

    const poll = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/jobs/${jobId}`);
        if (!response.ok) return;

        const data: JobResponse = await response.json();

        setStatus(data.status);

        if (data.title) setTitle(data.title);
        if (data.author) setAuthor(data.author);
        if (data.cover_image) setCoverImage(data.cover_image);
      } catch (err) {
        console.error(err);
      }
    };

    poll();
    const interval = setInterval(poll, 1000);

    return () => clearInterval(interval);
  }, []);

  const coverSrc =
    coverImage.startsWith("http") || coverImage.startsWith("/")
      ? `${BACKEND_URL}${coverImage}`
      : coverImage
        ? `${BACKEND_URL}/covers/${coverImage}`
        : "";

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 h-full w-full object-cover"
      >
        <source src="/blueFishie.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Content */}
      <div className="relative z-10 flex h-screen flex-col items-center justify-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute left-1/2 top-[12%] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-serif text-6xl tracking-[-0.04em] text-gray-300"
        >
          Your Book:
        </motion.h1>

        <AnimatePresence mode="wait">
          {status !== "ready" ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-5xl italic text-white/80"
            >
              Baking...Baking...
            </motion.div>
          ) : (
            <motion.div
              key="result"
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
                    className="h-[420px] w-[280px] object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-[420px] w-[280px] items-center justify-center rounded-2xl border border-white/20 bg-white/5 text-white/60">
                  No cover image
                </div>
              )}

              <div className="max-w-2xl">
                <div className="font-serif text-4xl tracking-[-0.04em] text-gray-100">
                  {title}
                </div>
                <div className="mt-2 font-sans text-lg italic text-gray-300/90">
                  {author}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {status === "ready" && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onClick={next}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 font-serif text-4xl tracking-[-0.04em] text-gray-300 transition-transform duration-500 hover:translate-x-2"
          >
            Back →
          </motion.button>
        )}
      </div>
    </main>
  );
}