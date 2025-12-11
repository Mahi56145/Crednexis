import { motion } from "framer-motion";
import { NeonCard } from "@/components/ui/NeonCard";
import { RiskScoreRing } from "@/components/ui/RiskScoreRing";
import { TrendingDown, FileText, Activity } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const trendData = [
  { name: "Mon", value: 22 },
  { name: "Tue", value: 28 },
  { name: "Wed", value: 18 },
  { name: "Thu", value: 32 },
  { name: "Fri", value: 24 },
  { name: "Sat", value: 19 },
  { name: "Sun", value: 15 },
];

const recentUploads = [
  { name: "Training_Data.csv", size: "2.4 MB", time: "2 hours ago" },
  { name: "Customer_Batch.csv", size: "892 KB", time: "5 hours ago" },
  { name: "Validation_Set.csv", size: "1.1 MB", time: "Yesterday" },
];

export const FloatingCards = () => {
  return (
    <div className="relative w-full h-[500px] md:h-[600px]">
      {/* Main Risk Score Card */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <NeonCard
          variant="pink"
          glow
          className="p-6 w-[280px] md:w-[320px] animate-float"
        >
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Default Risk Score
            </h3>
            <div className="flex justify-center mb-4">
              <RiskScoreRing score={12.7} size={140} />
            </div>
            <div className="flex items-center justify-center gap-2 text-neon-cyan">
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm font-medium">-3.2% from last week</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center">
                <RiskScoreRing score={45} size={60} strokeWidth={4} label="Payment Analysis" />
              </div>
              <div className="text-center">
                <RiskScoreRing score={28} size={60} strokeWidth={4} label="Credit Utilization" />
              </div>
            </div>
          </div>
        </NeonCard>
      </motion.div>

      {/* Recent Uploads Card - Top Left */}
      <motion.div
        className="absolute top-0 left-0 md:top-4 md:left-4 z-10"
        initial={{ opacity: 0, x: -50, y: -20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <NeonCard
          variant="cyan"
          glow
          className="p-4 w-[200px] md:w-[240px] animate-float-delayed"
        >
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-neon-cyan" />
            <h4 className="text-sm font-semibold text-foreground">Recent Uploads</h4>
          </div>
          <div className="space-y-2">
            {recentUploads.map((upload, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate max-w-[100px]">
                  {upload.name}
                </span>
                <span className="text-neon-cyan">{upload.size}</span>
              </div>
            ))}
          </div>
        </NeonCard>
      </motion.div>

      {/* Prediction Trends Card - Top Right */}
      <motion.div
        className="absolute top-0 right-0 md:top-8 md:right-0 z-10"
        initial={{ opacity: 0, x: 50, y: -20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <NeonCard
          variant="cyan"
          glow
          className="p-4 w-[200px] md:w-[260px] animate-float-slow"
        >
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-neon-cyan" />
            <h4 className="text-sm font-semibold text-foreground">Prediction Trends</h4>
          </div>
          <div className="h-[80px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(228, 20%, 12%)",
                    border: "1px solid hsl(189, 100%, 55%, 0.3)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(210, 40%, 98%)" }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(189, 100%, 55%)"
                  strokeWidth={2}
                  dot={false}
                  filter="drop-shadow(0 0 4px hsl(189, 100%, 55%))"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </NeonCard>
      </motion.div>

      {/* Another Upload History - Bottom Right */}
      <motion.div
        className="absolute bottom-0 right-8 md:bottom-4 md:right-16 z-10 hidden md:block"
        initial={{ opacity: 0, x: 30, y: 30 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <NeonCard
          variant="default"
          className="p-4 w-[200px] animate-float-delayed opacity-70"
        >
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Recent Uploads</h4>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Batch_Analysis</span>
              <span>00005</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Risk_Report</span>
              <span>00004</span>
            </div>
          </div>
        </NeonCard>
      </motion.div>
    </div>
  );
};
