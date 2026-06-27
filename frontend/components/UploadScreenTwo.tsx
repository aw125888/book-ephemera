"use client";

import { motion } from "framer-motion";
import { useState } from "react";

type UploadScreenTwoProps = {
  next: () => void;
};

const BACKEND_URL = "http://localhost:8000";

export default function UploadScreenTwo({ next }: UploadScreenTwoProps) {
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
        throw new Error("Missing job id. Upload image 1 first.");
      }

      const formData = new FormData();
      formData.append("image", file);

      const uploadResponse = await fetch(
        `${BACKEND_URL}/api/jobs/${jobId}/image?slot=2`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
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
        <source src="/EyesFlash.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/15" />

      {/* Content */}
      <div className="relative z-10 h-screen">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute left-1/2 top-10 -translate-x-1/2 font-serif text-8xl tracking-[-0.04em] text-[#A855F7]"
        >
          Now Another, Quick!
        </motion.h1>

        {/* Upload */}
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
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
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

            <div className="flex h-64 w-64 items-center justify-center rounded-full border-[3px] border-[#A855F7] bg-[#A855F7]/5">
              <span className="font-serif text-6xl text-[#A855F7]">
                {uploading ? "..." : "+"}
              </span>
            </div>
          </motion.div>
        </motion.label>

        {/* Next button */}
        {uploaded && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onClick={next}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 font-serif text-4xl tracking-[-0.04em] text-[#A855F7] transition-transform duration-500 hover:translate-x-2"
          >
            Next →
          </motion.button>
        )}

        {error && (
          <div className="absolute left-1/2 top-[420px] -translate-x-1/2 font-sans text-sm text-red-300">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}