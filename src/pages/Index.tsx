import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { motion } from "framer-motion";
import { NeonButton } from "@/components/ui/NeonButton";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        
        {/* CTA Section */}
        <section id="pricing" className="py-20">
          <div className="container mx-auto px-6">
            <motion.div
              className="text-center glass-card-cyan p-12 rounded-2xl"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ready to Predict <span className="gradient-text-pink">Risk</span>?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Start using CredNexis today and make smarter credit decisions with AI-powered predictions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <NeonButton variant="cyan" size="lg">
                  Get Started Free
                </NeonButton>
                <NeonButton variant="outline-pink" size="lg">
                  Contact Sales
                </NeonButton>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer id="contact" className="py-12 border-t border-border/50">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-pink flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">CN</span>
                </div>
                <span className="text-xl font-bold text-foreground">
                  Cred<span className="text-neon-cyan">Nexis</span>
                </span>
              </div>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-neon-cyan transition-colors">Privacy</a>
                <a href="#" className="hover:text-neon-cyan transition-colors">Terms</a>
                <a href="#" className="hover:text-neon-cyan transition-colors">Documentation</a>
                <a href="#" className="hover:text-neon-cyan transition-colors">Support</a>
              </div>
              <p className="text-sm text-muted-foreground">
                © 2024 CredNexis. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
