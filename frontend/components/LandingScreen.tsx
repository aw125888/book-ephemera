"use client";

import { motion } from "framer-motion";

type LandingScreenProps = {
  next: () => void;
};

export default function LandingScreen({ next }: LandingScreenProps) {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 h-full w-full object-cover"
      >
        <source src="/Things2Come.mp4" type="video/mp4" />
      </video>

      <div className="fixed inset-0 bg-black/20" />

      <div className="relative z-10 flex h-screen flex-col justify-between">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-10 pt-8"
        >
          
        </motion.div>

        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-4xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-serif text-[72px] leading-[0.92] tracking-[-0.04em] text-white md:text-[110px]"
            >
              Sentiment
              <br />
              2 Novel
            </motion.h1>

            <motion.button
              type="button"
              onClick={next}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="group mt-24 font-serif text-4xl tracking-[-0.03em] text-white"
            >
              Calculate book
              <span className="ml-2 inline-block transition-transform duration-500 group-hover:translate-x-2">
                →
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </main>
  );
}