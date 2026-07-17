"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

type UploadScreenOneProps = {
  next: () => void;
};

const uploadPos =
  "absolute right-[clamp(60px,10vw,170px)] top-[clamp(80px,15vh,160px)]";
const boxSize =
  "relative flex h-[clamp(180px,22vw,260px)] w-[clamp(180px,22vw,260px)] items-center justify-center";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;
const JOB_KEY = "book-ephemera-job-id";

export default function UploadScreenOne({ next }: UploadScreenOneProps) {
  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [jobReady, setJobReady] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const startFreshJob = async () => {
      try {
        localStorage.removeItem(JOB_KEY);

        const response = await fetch(`${BACKEND_URL}/api/jobs`, {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Could not create job.");
        }

        const data = await response.json();
        setJobId(data.job_id);
        localStorage.setItem(JOB_KEY, data.job_id);
        setJobReady(true);
      } catch (err) {
        console.error(err);
        setError("Could not start a new job.");
      }
    };

    startFreshJob();
  }, []);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      if (!jobReady || !jobId) {
        throw new Error("Job not ready yet.");
      }

      const formData = new FormData();
      formData.append("image", file);

      const uploadResponse = await fetch(
        `${BACKEND_URL}/api/jobs/${jobId}/image?slot=1`,
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
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 h-full w-full object-cover"
      >
        <source src="/tomHanksSparkles.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-black/15" />

      <div className="relative z-10 h-screen">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute left-1/2 top-[clamp(20px,4vh,40px)] -translate-x-1/2 whitespace-nowrap font-serif text-[clamp(3rem,6vw,6rem)] tracking-[-0.04em] text-[#4A7CFF]"
        >
          Choose An Image...!
        </motion.h1>

        <div className={uploadPos}>
          {!uploaded ? (
            <motion.label
              initial={{ x: -300, opacity: 0, rotate: -25, scale: 0.9 }}
              animate={{ x: 0, opacity: 1, rotate: 0, scale: 1 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className={`block ${
                uploading || !jobReady ? "pointer-events-none" : "cursor-pointer"
              } group`}
            >
              <motion.div
                animate={{ rotate: [0, 2, 0, -2, 0] }}
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
                  disabled={uploading || !jobReady}
                  onChange={handleFileChange}
                />

                <div className={boxSize}>
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

                  <span className="relative z-10 font-serif text-[clamp(2rem,4vw,3rem)] text-[#4A7CFF]">
                    {jobReady ? (uploading ? "..." : "+") : "..."}
                  </span>
                </div>
              </motion.div>
            </motion.label>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none"
            >
              <div className={boxSize}>
                <motion.svg
                  viewBox="0 0 240 240"
                  className="absolute inset-0 h-full w-full"
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <polygon
                    points="120,8 145,88 232,88 160,138 186,222 120,174 54,222 80,138 8,88 95,88"
                    fill="rgba(74,124,255,0.03)"
                    stroke="#4A7CFF"
                    strokeWidth="2.5"
                  />
                </motion.svg>

                <span className="relative z-10 font-serif text-[clamp(1.2rem,2vw,1.5rem)] text-[#4A7CFF]">
                  Done!
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {error && (
          <div className="absolute left-1/2 top-[420px] -translate-x-1/2 font-sans text-sm text-red-300">
            {error}
          </div>
        )}

        {uploaded && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onClick={next}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 font-serif text-[clamp(2rem,3vw,2.25rem)] tracking-[-0.04em] text-[#4A7CFF] transition-transform duration-500 hover:translate-x-2"
          >
            Next →
          </motion.button>
        )}
      </div>
    </main>
  );
}