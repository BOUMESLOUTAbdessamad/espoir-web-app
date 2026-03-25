import { motion, useMotionValue, useAnimationFrame, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface GradientTextProps extends React.ComponentProps<"span"> {
  text: string;
  gradient?: string;
  neon?: boolean;
  className?: string;
}

export function GradientText({
  text,
  gradient = "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 20%, #ec4899 50%, hsl(var(--accent)) 80%, hsl(var(--primary)) 100%)",
  neon = false,
  className,
  ...props
}: GradientTextProps) {
  const x = useMotionValue(0);

  useAnimationFrame((_, delta) => {
    x.set(x.get() + delta * 0.05);
  });

  const backgroundPosition = useTransform(x, (val) => `${val % 200}% center`);

  return (
    <span className="relative inline-block" {...props}>
      {neon && (
        <motion.span
          aria-hidden
          className={cn("absolute inset-0 blur-lg opacity-50", className)}
          style={{
            backgroundImage: gradient,
            backgroundSize: "200% auto",
            backgroundPosition,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {text}
        </motion.span>
      )}
      <motion.span
        className={cn(className)}
        style={{
          backgroundImage: gradient,
          backgroundSize: "200% auto",
          backgroundPosition,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {text}
      </motion.span>
    </span>
  );
}
