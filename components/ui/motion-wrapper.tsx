"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface MotionWrapperProps extends HTMLMotionProps<"div"> {
  index?: number;
}

export function MotionWrapper({ children, index = 0, className, ...props }: MotionWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20,
        delay: Math.min(index * 0.05, 0.5) // Cap delay at 0.5s so it doesn't take forever
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn("w-full h-full", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
