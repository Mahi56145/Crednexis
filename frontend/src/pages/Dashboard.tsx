import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { SinglePredictionForm } from "@/components/dashboard/SinglePredictionForm";
import { CSVPredictionPanel } from "@/components/dashboard/CSVPredictionPanel";
import { PredictionHistory } from "@/components/dashboard/PredictionHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, User, History } from "lucide-react";
import { useAuth } from "@/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type DashboardProps = {
  demoMode?: boolean;
};

const Dashboard = ({ demoMode = false }: DashboardProps) => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Background Effects */}
      <div className="fixed inset-0 bg-hero-glow pointer-events-none opacity-50" />
      <div className="fixed inset-0 grid-bg opacity-20 pointer-events-none" />

      <main className="relative pt-24 pb-12">
        <div className="container mx-auto px-6">
          {/* Header */}
          <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">{demoMode ? "Demo Mode" : "AI CoPilot"}</p>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Hello {user?.name || "Analyst"}, ready to assess risk?
                </h1>
              </div>
              <p className="text-muted-foreground">Upload data, run predictions, and analyze credit risk with AI precision.</p>
            </div>
          </motion.div>

          {demoMode && (
            <Alert className="mb-8 border-neon-cyan/40 bg-neon-cyan/5">
              <AlertTitle>Demo mode active</AlertTitle>
              <AlertDescription>
                Sign in to unlock full history syncing, persistent explainability, and one-click CSV exports secured with your workspace key.
              </AlertDescription>
            </Alert>
          )}

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
                <CSVPredictionPanel demoMode={demoMode} />
              </TabsContent>

              <TabsContent value="single" className="mt-6">
                <SinglePredictionForm demoMode={demoMode} />
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <PredictionHistory demoMode={demoMode} />
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
