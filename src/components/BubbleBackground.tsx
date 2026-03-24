import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

const BubbleBackground = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  const generateBubbles = useCallback(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 60 + Math.random() * 200,
      delay: Math.random() * 4,
      duration: 5 + Math.random() * 6,
    }));
  }, []);

  useEffect(() => {
    setBubbles(generateBubbles());
  }, [generateBubbles]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {bubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          className="absolute rounded-full"
          style={{
            left: `${bubble.x}%`,
            top: `${bubble.y}%`,
            width: bubble.size,
            height: bubble.size,
            background: `radial-gradient(circle, hsl(354 100% 63% / 0.08), hsl(30 100% 70% / 0.04))`,
          }}
          animate={{
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: bubble.duration,
            delay: bubble.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default BubbleBackground;
