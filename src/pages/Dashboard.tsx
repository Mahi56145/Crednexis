import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { NeonButton } from "@/components/ui/NeonButton";
import { SinglePredictionForm } from "@/components/dashboard/SinglePredictionForm";
import { CSVPredictionPanel } from "@/components/dashboard/CSVPredictionPanel";
import { PredictionHistory } from "@/components/dashboard/PredictionHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, User, History, BarChart3 } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Background Effects */}
      <div className="fixed inset-0 bg-hero-glow pointer-events-none opacity-50" />
      <div className="fixed inset-0 grid-bg opacity-20 pointer-events-none" />

      <main className="relative pt-24 pb-12">
        <div className="container mx-auto px-6">
          {/* Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Prediction <span className="gradient-text-cyan">Dashboard</span>
            </h1>
            <p className="text-muted-foreground">
              Upload data, run predictions, and analyze credit risk with AI precision.
            </p>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Tabs defaultValue="csv" className="space-y-6">
              <TabsList className="bg-glass-bg/80 border border-glass-border p-1">
                <TabsTrigger
                  value="csv"
                  className="data-[state=active]:bg-neon-cyan/20 data-[state=active]:text-neon-cyan"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  CSV Upload
                </TabsTrigger>
                <TabsTrigger
                  value="single"
                  className="data-[state=active]:bg-neon-pink/20 data-[state=active]:text-neon-pink"
                >
                  <User className="w-4 h-4 mr-2" />
                  Single Prediction
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-neon-cyan/20 data-[state=active]:text-neon-cyan"
                >
                  <History className="w-4 h-4 mr-2" />
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="csv" className="mt-6">
                <CSVPredictionPanel />
              </TabsContent>

              <TabsContent value="single" className="mt-6">
                <SinglePredictionForm />
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <PredictionHistory />
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
