"use client";

import { motion } from "framer-motion";
import { useState } from "react";

type UploadScreenOneProps = {
  next: () => void;
};

const BACKEND_URL = "http://localhost:8000";

export default function UploadScreenOne({ next }: UploadScreenOneProps) {
  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createJob(): Promise<string> {
    const response = await fetch(`${BACKEND_URL}/api/jobs`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Could not create job.");
    }

    const data = await response.json();

    localStorage.setItem("book-ephemera-job-id", data.job_id);

    return data.job_id;
  }

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      let jobId = localStorage.getItem("book-ephemera-job-id");

      if (!jobId) {
        jobId = await createJob();
      }

      const formData = new FormData();
      formData.append("image", file);

      let uploadResponse: Response | null = null;

      for (let attempt = 0; attempt < 2; attempt++) {
        uploadResponse = await fetch(
          `${BACKEND_URL}/api/jobs/${jobId}/image?slot=1`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (uploadResponse.ok) {
          break;
        }

        if (uploadResponse.status === 404 && attempt === 0) {
          jobId = await createJob();
          continue;
        }

        throw new Error(await uploadResponse.text());
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
        <source src="/tomHanksSparkles.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/15" />

      {/* Content */}
      <div className="relative z-10 h-screen">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute left-1/2 top-10 -translate-x-1/2 font-serif text-8xl tracking-[-0.04em] text-[#4A7CFF]"
        >
          Choose An Image...!
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
          className="absolute right-10 top-24 cursor-pointer group"
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
              disabled={uploading}
              onChange={handleFileChange}
            />

            <div className="relative flex h-[260px] w-[260px] items-center justify-center">
              <svg
                viewBox="0 0 240 240"
                className="absolute inset-0 h-full w-full"
              >
                <polygon
                  points="120,8 145,88 232,88 160,138 186,222 120,174 54,222 80,138 8,88 95,88"
                  fill="rgba(74,124,255,0.03)"
                  stroke="#4A7CFF"
                  strokeWidth="2.5"
                />
              </svg>

              <span className="relative z-10 font-serif text-5xl text-[#4A7CFF]">
                {uploading ? "..." : "+"}
              </span>
            </div>
          </motion.div>
        </motion.label>

        {/* Keywords */}
        <div className="absolute left-16 top-[340px] flex flex-wrap gap-3">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-serif italic text-lg text-white/70"
          >
            As long...
          </motion.span>

          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="font-serif italic text-lg text-white/70"
          >
            ...as it's...
          </motion.span>

          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="font-serif italic text-lg text-white/70"
          >
            ...cool!
          </motion.span>
        </div>

        {error && (
          <div className="absolute left-1/2 top-[420px] -translate-x-1/2 font-sans text-sm text-red-300">
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
            className="fixed bottom-8 left-1/2 -translate-x-1/2 font-serif text-4xl tracking-[-0.04em] text-[#4A7CFF] transition-transform duration-500 hover:translate-x-2"
          >
            Next →
          </motion.button>
        )}
      </div>
    </main>
  );
}