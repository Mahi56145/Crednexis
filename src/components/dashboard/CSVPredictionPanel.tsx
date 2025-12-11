import { useState } from "react";
import { motion } from "framer-motion";
import { NeonCard } from "@/components/ui/NeonCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { FileUpload } from "@/components/ui/FileUpload";
import { api, CSVPredictionResponse } from "@/utils/api";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, TrendingDown, TrendingUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const CSVPredictionPanel = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<CSVPredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setResult(null);
  };

  const handlePredict = async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      const prediction = await api.predictCSV(selectedFile);
      setResult(prediction);
      toast({
        title: "CSV Analysis Complete",
        description: `Analyzed ${prediction.summary.total} records`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process CSV file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const pieData = result
    ? [
        { name: "Non-Default", value: result.summary.non_defaulters, color: "hsl(189, 100%, 55%)" },
        { name: "Default", value: result.summary.defaulters, color: "hsl(316, 100%, 67%)" },
      ]
    : [];

  // Create histogram data
  const histogramData = result
    ? [
        { range: "0-20%", count: result.predictions.filter((p) => p.risk_score <= 20).length },
        { range: "20-40%", count: result.predictions.filter((p) => p.risk_score > 20 && p.risk_score <= 40).length },
        { range: "40-60%", count: result.predictions.filter((p) => p.risk_score > 40 && p.risk_score <= 60).length },
        { range: "60-80%", count: result.predictions.filter((p) => p.risk_score > 60 && p.risk_score <= 80).length },
        { range: "80-100%", count: result.predictions.filter((p) => p.risk_score > 80).length },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <NeonCard variant="cyan" className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Upload CSV File</h3>
        <FileUpload onFileSelect={handleFileSelect} className="mb-4" />
        {selectedFile && (
          <div className="flex justify-center">
            <NeonButton variant="cyan" onClick={handlePredict} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Analyze CSV"
              )}
            </NeonButton>
          </div>
        )}
      </NeonCard>

      {/* Results Section */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NeonCard variant="default" className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{result.summary.total}</div>
              <div className="text-sm text-muted-foreground">Total Records</div>
            </NeonCard>
            <NeonCard variant="cyan" className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-neon-cyan" />
                <span className="text-2xl font-bold text-neon-cyan">{result.summary.non_defaulters}</span>
              </div>
              <div className="text-sm text-muted-foreground">Non-Defaulters</div>
            </NeonCard>
            <NeonCard variant="pink" className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <XCircle className="w-5 h-5 text-neon-pink" />
                <span className="text-2xl font-bold text-neon-pink">{result.summary.defaulters}</span>
              </div>
              <div className="text-sm text-muted-foreground">Defaulters</div>
            </NeonCard>
            <NeonCard variant="default" className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                {result.summary.average_risk > 50 ? (
                  <TrendingUp className="w-5 h-5 text-neon-pink" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-neon-cyan" />
                )}
                <span className="text-2xl font-bold text-foreground">
                  {result.summary.average_risk.toFixed(1)}%
                </span>
              </div>
              <div className="text-sm text-muted-foreground">Avg Risk</div>
            </NeonCard>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <NeonCard variant="default" className="p-6">
              <h4 className="text-lg font-semibold text-foreground mb-4">Distribution</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(228, 20%, 12%)",
                        border: "1px solid hsl(228, 15%, 25%)",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </NeonCard>

            {/* Histogram */}
            <NeonCard variant="default" className="p-6">
              <h4 className="text-lg font-semibold text-foreground mb-4">Risk Distribution</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogramData}>
                    <XAxis dataKey="range" tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }} />
                    <YAxis tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(228, 20%, 12%)",
                        border: "1px solid hsl(228, 15%, 25%)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(189, 100%, 55%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </NeonCard>
          </div>

          {/* Results Table */}
          <NeonCard variant="default" className="p-6">
            <h4 className="text-lg font-semibold text-foreground mb-4">Detailed Results</h4>
            <div className="overflow-auto max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">ID</TableHead>
                    <TableHead className="text-muted-foreground">Prediction</TableHead>
                    <TableHead className="text-muted-foreground">Probability</TableHead>
                    <TableHead className="text-muted-foreground">Risk Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.predictions.slice(0, 20).map((pred) => (
                    <TableRow key={pred.id} className="border-border/50">
                      <TableCell className="text-foreground">{pred.id}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            pred.prediction === 1
                              ? "bg-neon-pink/20 text-neon-pink"
                              : "bg-neon-cyan/20 text-neon-cyan"
                          }`}
                        >
                          {pred.prediction === 1 ? "Default" : "Non-Default"}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {(pred.probability * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell
                        className={pred.risk_score > 50 ? "text-neon-pink" : "text-neon-cyan"}
                      >
                        {pred.risk_score.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </NeonCard>
        </motion.div>
      )}
    </div>
  );
};
