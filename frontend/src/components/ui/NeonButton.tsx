import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface NeonButtonProps extends HTMLMotionProps<"button"> {
  variant?: "cyan" | "pink" | "outline-cyan" | "outline-pink";
  size?: "default" | "sm" | "lg";
  children: React.ReactNode;
}

const NeonButton = forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ className, variant = "cyan", size = "default", children, ...props }, ref) => {
    const baseStyles = "relative font-semibold rounded-lg transition-all duration-300 overflow-hidden";
    
    const variants = {
      cyan: "bg-neon-cyan text-primary-foreground hover:shadow-[0_0_30px_hsl(var(--neon-cyan)/0.6)]",
      pink: "bg-neon-pink text-secondary-foreground hover:shadow-[0_0_30px_hsl(var(--neon-pink)/0.6)]",
      "outline-cyan": "bg-transparent border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 hover:shadow-[0_0_30px_hsl(var(--neon-cyan)/0.4)]",
      "outline-pink": "bg-transparent border-2 border-neon-pink text-neon-pink hover:bg-neon-pink/10 hover:shadow-[0_0_30px_hsl(var(--neon-pink)/0.4)]",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      default: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        <span className="relative z-10">{children}</span>
      </motion.button>
    );
  }
);

NeonButton.displayName = "NeonButton";

export { NeonButton };
