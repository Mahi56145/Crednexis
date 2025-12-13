import { motion } from "framer-motion";
import { NeonButton } from "@/components/ui/NeonButton";
import { FloatingCards } from "./FloatingCards";
import { Upload, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen pt-24 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      
      {/* Grid floor effect */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[40%] pointer-events-none opacity-50"
        style={{
          background: "linear-gradient(to top, hsl(var(--neon-cyan) / 0.05) 0%, transparent 100%)",
          maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
        }}
      />

      <div className="container mx-auto px-6 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="w-4 h-4 text-neon-cyan" />
              <span className="text-sm text-neon-cyan font-medium">AI-Powered Risk Analysis</span>
            </motion.div>

            {/* Title */}
            <div className="space-y-4">
              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span className="gradient-text-cyan italic">CREDIT CARD</span>
                <br />
                <span className="text-foreground">DEFAULT PREDICTION</span>
              </motion.h1>
              
              <motion.p
                className="text-lg md:text-xl text-muted-foreground max-w-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Predict Financial Risk with AI Precision
              </motion.p>
            </div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Link to="/dashboard">
                <NeonButton variant="outline-cyan" size="lg" className="w-full sm:w-auto">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload CSV
                </NeonButton>
              </Link>
              <Link to="/dashboard">
                <NeonButton variant="outline-pink" size="lg" className="w-full sm:w-auto">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Run Prediction
                </NeonButton>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-3 gap-6 pt-8 border-t border-border/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div>
                <div className="text-2xl md:text-3xl font-bold text-neon-cyan">98.5%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-neon-pink">1M+</div>
                <div className="text-sm text-muted-foreground">Predictions</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-foreground">24/7</div>
                <div className="text-sm text-muted-foreground">Availability</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Floating Cards */}
          <motion.div
            className="relative hidden lg:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <FloatingCards />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
