import { motion } from "framer-motion";
import { NeonCard } from "@/components/ui/NeonCard";
import { Brain, Shield, Zap, BarChart3, Upload, Clock } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Advanced machine learning models trained on millions of credit records for accurate predictions.",
    color: "cyan" as const,
  },
  {
    icon: Shield,
    title: "Risk Assessment",
    description: "Comprehensive risk scoring that helps identify potential defaulters before they occur.",
    color: "pink" as const,
  },
  {
    icon: Zap,
    title: "Real-time Processing",
    description: "Get instant predictions with our optimized inference engine for rapid decision making.",
    color: "cyan" as const,
  },
  {
    icon: BarChart3,
    title: "Detailed Analytics",
    description: "Rich visualizations and insights to understand risk patterns across your portfolio.",
    color: "pink" as const,
  },
  {
    icon: Upload,
    title: "Batch Processing",
    description: "Upload CSV files with thousands of records and get predictions in seconds.",
    color: "cyan" as const,
  },
  {
    icon: Clock,
    title: "Historical Tracking",
    description: "Track prediction history and monitor trends over time for better risk management.",
    color: "pink" as const,
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-cyan/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Powerful <span className="gradient-text-cyan">Features</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to predict and manage credit card default risk with confidence.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <NeonCard
                variant={feature.color}
                glow
                className="p-6 h-full hover:scale-[1.02] transition-transform duration-300"
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${feature.color === 'cyan' ? 'bg-neon-cyan/20' : 'bg-neon-pink/20'}`}>
                  <feature.icon className={`w-6 h-6 ${feature.color === 'cyan' ? 'text-neon-cyan' : 'text-neon-pink'}`} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </NeonCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
