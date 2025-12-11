import { motion } from "framer-motion";
import { NeonCard } from "@/components/ui/NeonCard";
import { samplePredictionHistory } from "@/utils/api";
import { FileText, Calendar, Users, TrendingUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const accuracyData = [
  { date: "Jan 1", accuracy: 96.2 },
  { date: "Jan 5", accuracy: 97.1 },
  { date: "Jan 10", accuracy: 96.8 },
  { date: "Jan 15", accuracy: 98.3 },
  { date: "Jan 20", accuracy: 97.9 },
  { date: "Jan 25", accuracy: 98.5 },
  { date: "Jan 30", accuracy: 98.1 },
];

const predictionTrendData = [
  { date: "Week 1", predictions: 1240, defaults: 280 },
  { date: "Week 2", predictions: 1580, defaults: 320 },
  { date: "Week 3", predictions: 1320, defaults: 290 },
  { date: "Week 4", predictions: 1890, defaults: 410 },
];

export const PredictionHistory = () => {
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <NeonCard variant="cyan" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neon-cyan/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-neon-cyan" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">156</div>
              <div className="text-xs text-muted-foreground">Total Uploads</div>
            </div>
          </div>
        </NeonCard>
        <NeonCard variant="pink" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neon-pink/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-neon-pink" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">48.2K</div>
              <div className="text-xs text-muted-foreground">Records Analyzed</div>
            </div>
          </div>
        </NeonCard>
        <NeonCard variant="default" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-neon-cyan" />
            </div>
            <div>
              <div className="text-2xl font-bold text-neon-cyan">98.5%</div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>
          </div>
        </NeonCard>
        <NeonCard variant="default" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">23.1%</div>
              <div className="text-xs text-muted-foreground">Avg Default Rate</div>
            </div>
          </div>
        </NeonCard>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Accuracy Chart */}
        <NeonCard variant="cyan" glow className="p-6">
          <h4 className="text-lg font-semibold text-foreground mb-4">Model Accuracy</h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={accuracyData}>
                <defs>
                  <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(189, 100%, 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(189, 100%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }} />
                <YAxis domain={[94, 100]} tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(228, 20%, 12%)",
                    border: "1px solid hsl(189, 100%, 55%, 0.3)",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="accuracy"
                  stroke="hsl(189, 100%, 55%)"
                  strokeWidth={2}
                  fill="url(#accuracyGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </NeonCard>

        {/* Prediction Trends */}
        <NeonCard variant="pink" glow className="p-6">
          <h4 className="text-lg font-semibold text-foreground mb-4">Prediction Trends</h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predictionTrendData}>
                <XAxis dataKey="date" tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(228, 20%, 12%)",
                    border: "1px solid hsl(316, 100%, 67%, 0.3)",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="predictions"
                  stroke="hsl(189, 100%, 55%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(189, 100%, 55%)" }}
                />
                <Line
                  type="monotone"
                  dataKey="defaults"
                  stroke="hsl(316, 100%, 67%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(316, 100%, 67%)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </NeonCard>
      </div>

      {/* Recent Uploads Table */}
      <NeonCard variant="default" className="p-6">
        <h4 className="text-lg font-semibold text-foreground mb-4">Recent Uploads</h4>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">Filename</TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Records</TableHead>
                <TableHead className="text-muted-foreground">Avg Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {samplePredictionHistory.map((item) => (
                <TableRow key={item.id} className="border-border/50">
                  <TableCell className="text-foreground font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-neon-cyan" />
                      {item.filename}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.date}</TableCell>
                  <TableCell className="text-muted-foreground">{item.records.toLocaleString()}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.avgRisk > 25
                          ? "bg-neon-pink/20 text-neon-pink"
                          : "bg-neon-cyan/20 text-neon-cyan"
                      }`}
                    >
                      {item.avgRisk.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </NeonCard>
    </div>
  );
};
