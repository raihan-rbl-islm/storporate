"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function AnimatedProgress({ value }: { value: number }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Delay slightly to allow the page to mount and trigger the animation visually
    const t = setTimeout(() => setProgress(value), 100);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="h-3 w-full overflow-hidden rounded-full bg-muted shadow-inner relative"
    >
      <motion.div
        className="h-full bg-gradient-to-r from-primary/80 to-primary"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ type: "spring", stiffness: 50, damping: 15, duration: 1 }}
      />
    </div>
  );
}
