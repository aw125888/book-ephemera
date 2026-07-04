"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import LandingScreen from "@/components/LandingScreen";
import UploadScreen from "@/components/UploadScreen";
import UploadScreenTwo from "@/components/UploadScreenTwo";
import UploadScreenThree from "@/components/UploadScreenThree";
import MemoryScreen from "@/components/MemoryScreen";
import LoadingScreen from "@/components/LoadingScreen";
import ResultScreen from "@/components/ResultScreen";

export default function Home() {
  const [step, setStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const goTo = (nextStep: number) => {
    setTransitioning(true);

    setTimeout(() => {
      setStep(nextStep);
    }, 10);

    setTimeout(() => {
      setTransitioning(false);
    }, 1);
  };

  let screen = null;

  switch (step) {
    case 0:
      screen = <LandingScreen next={() => goTo(1)} />;
      break;
    case 1:
      screen = (
        <UploadScreen
          next={() => goTo(2)}
        />
      );
      break;
    case 2:
      screen = (
        <UploadScreenTwo
          next={() => goTo(3)}
        />
      );
      break;
    case 3:
      screen = (
        <UploadScreenThree
          next={() => goTo(4)}
        />
      );
      break;
    case 4:
      screen = <MemoryScreen next={() => goTo(5)} />;
      break;
    case 5:
      screen = <LoadingScreen next={() => goTo(6)} />;
      break;
    case 6:
      screen = <ResultScreen next={() => goTo(0)}/>;
      break;
    default:
      screen = null;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: transitioning ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          {screen}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {transitioning && (
          <motion.div
            key="black-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-0 z-50 bg-black"
          />
        )}
      </AnimatePresence>
    </>
  );
}