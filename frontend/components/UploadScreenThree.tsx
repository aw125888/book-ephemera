"use client";

import { motion } from "framer-motion";
import { useState } from "react";

type UploadScreenThreeProps = {
  next: () => void;
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export default function UploadScreenThree({ next }: UploadScreenThreeProps) {
  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const jobId = localStorage.getItem("book-ephemera-job-id");

      if (!jobId) {
        throw new Error("Missing job id.");
      }

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `${BACKEND_URL}/api/jobs/${jobId}/image?slot=3`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      setUploaded(true);
    } catch (err) {
      console.error(err);
      setError("Could not upload image.");
    } finally {
      setUploading(false);
    }
  };

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
        <source src="/aBlueHer.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/15" />

      {/* Content */}
      <div className="relative z-10 h-screen">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute left-1/2 top-[clamp(28px,12vh,90px)] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-serif text-[clamp(2.5rem,5vw,4.5rem)] tracking-[-0.04em] text-gray-400"
        >
          Last Image, Take Your Time.
        </motion.h1>

        {/* Upload */}
        {uploaded ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2"
          >
            <div className="relative flex h-[clamp(180px,22vw,256px)] w-[clamp(180px,22vw,256px)] items-center justify-center">
              <motion.div
                className="absolute h-[clamp(180px,22vw,256px)] w-[clamp(180px,22vw,256px)] border-[3px] border-gray-400 bg-gray-400/5"
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
              />

              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative z-10 font-serif text-[clamp(1.2rem,2vw,1.5rem)] text-gray-400"
              >
                Interesting Choice...
              </motion.span>
            </div>
          </motion.div>
        ) : (
          <motion.label
            initial={{
              x: -300,
              opacity: 0,
              rotate: -25,
              scale: 0.9,
            }}
            animate={{
              x: 0,
              opacity: 1,
              rotate: 0,
              scale: 1,
            }}
            transition={{
              duration: 1.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={`absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 ${
              uploading ? "pointer-events-none" : "cursor-pointer"
            }`}
          >
            <motion.div
              animate={{
                rotate: [0, 2, 0, -2, 0],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
                disabled={uploading}
              />

              <div className="flex h-[clamp(180px,22vw,256px)] w-[clamp(180px,22vw,256px)] items-center justify-center border-[3px] border-gray-400 bg-gray-400/5">
                <span className="font-serif text-[clamp(2.5rem,5vw,3.75rem)] text-gray-400">
                  {uploading ? "..." : "+"}
                </span>
              </div>
            </motion.div>
          </motion.label>
        )}

        {error && (
          <div className="absolute left-1/2 top-[clamp(300px,56vh,420px)] -translate-x-1/2 font-sans text-[clamp(0.75rem,1.2vw,0.875rem)] text-red-300">
            {error}
          </div>
        )}

        {/* Next button */}
        {uploaded && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onClick={next}
            className="fixed bottom-[clamp(20px,4vh,40px)] left-1/2 -translate-x-1/2 font-serif text-[clamp(2rem,3vw,2.25rem)] tracking-[-0.04em] text-gray-400 transition-transform duration-500 hover:translate-x-2"
          >
            Next →
          </motion.button>
        )}
      </div>
    </main>
  );
}