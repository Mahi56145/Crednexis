import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface NeonCardProps extends HTMLMotionProps<"div"> {
  variant?: "default" | "cyan" | "pink" | "purple";
  glow?: boolean;
  children: React.ReactNode;
}

const NeonCard = forwardRef<HTMLDivElement, NeonCardProps>(
  ({ className, variant = "default", glow = false, children, ...props }, ref) => {
    const baseStyles = "relative rounded-xl backdrop-blur-xl border transition-all duration-300";
    
    const variants = {
      default: "bg-glass-bg/80 border-glass-border",
      cyan: "bg-glass-bg/80 border-neon-cyan/30 shadow-[0_0_30px_hsl(var(--neon-cyan)/0.1)]",
      pink: "bg-glass-bg/80 border-neon-pink/30 shadow-[0_0_30px_hsl(var(--neon-pink)/0.1)]",
      purple: "bg-glass-bg/80 border-neon-purple/30 shadow-[0_0_30px_hsl(var(--neon-purple)/0.1)]",
    };

    const glowStyles = {
      default: "",
      cyan: glow ? "hover:shadow-[0_0_50px_hsl(var(--neon-cyan)/0.2)]" : "",
      pink: glow ? "hover:shadow-[0_0_50px_hsl(var(--neon-pink)/0.2)]" : "",
      purple: glow ? "hover:shadow-[0_0_50px_hsl(var(--neon-purple)/0.2)]" : "",
    };

    return (
      <motion.div
        ref={ref}
        className={cn(baseStyles, variants[variant], glowStyles[variant], className)}
        {...props}
      >
        {/* Inner glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }
);

NeonCard.displayName = "NeonCard";

export { NeonCard };
