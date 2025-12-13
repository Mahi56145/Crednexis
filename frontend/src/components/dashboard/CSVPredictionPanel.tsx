import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { NeonCard } from "@/components/ui/NeonCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { FileUpload } from "@/components/ui/FileUpload";
import { api, CSVPredictionResponse } from "@/utils/api";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, TrendingDown, TrendingUp, Download } from "lucide-react";
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
import { useAuth } from "@/auth";

type CSVPanelProps = {
  demoMode?: boolean;
};

const buildCsv = (result: CSVPredictionResponse) => {
  const headers = ["id", "prediction", "probability", "risk_score"];
  const rows = result.predictions.map((entry) => [entry.id, entry.prediction, entry.probability.toFixed(6), entry.risk_score.toFixed(4)]);
  const csvLines = [headers.join(","), ...rows.map((row) => row.join(","))];
  return csvLines.join("\n");
};

export const CSVPredictionPanel = ({ demoMode = false }: CSVPanelProps) => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<CSVPredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setResult(null);
  };

  const handleFileClear = () => {
    setSelectedFile(null);
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
      setResult(null);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process CSV file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([buildCsv(result)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "crednexis_predictions.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const pieData = result
    ? [
        { name: "Non-Default", value: result.summary.non_defaulters, color: "hsl(189, 100%, 55%)" },
        { name: "Default", value: result.summary.defaulters, color: "hsl(316, 100%, 67%)" },
      ]
    : [];

  const histogramData = useMemo(() => {
    if (!result) return [];
    const buckets = [
      { range: "0-20%", min: 0, max: 20 },
      { range: "20-40%", min: 20, max: 40 },
      { range: "40-60%", min: 40, max: 60 },
      { range: "60-80%", min: 60, max: 80 },
      { range: "80-100%", min: 80, max: 100.0001 },
    ];
    return buckets.map((bucket) => ({
      range: bucket.range,
      count: result.predictions.filter((p) => p.risk_score >= bucket.min && p.risk_score < bucket.max).length,
    }));
  }, [result]);

  const previewRows = result?.preview_rows ?? [];

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <NeonCard variant="cyan" className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Upload CSV File</h3>
        <FileUpload onFileSelect={handleFileSelect} onFileClear={handleFileClear} className="mb-4" />
        {selectedFile && (
          <div className="flex flex-col sm:flex-row justify-center gap-4 text-center">
            <NeonButton variant="cyan" onClick={handlePredict} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing
                </>
              ) : (
                "Analyze CSV"
              )}
            </NeonButton>
            {result && !demoMode && user && (
              <NeonButton variant="outline-cyan" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </NeonButton>
            )}
          </div>
        )}
        {!user && selectedFile && <p className="text-xs text-muted-foreground text-center mt-3">Sign in to enable exports.</p>}
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
                            pred.prediction === 1 ? "bg-neon-pink/20 text-neon-pink" : "bg-neon-cyan/20 text-neon-cyan"
                          }`}
                        >
                          {pred.prediction === 1 ? "Default" : "Non-Default"}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {(pred.probability * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className={pred.risk_score > 50 ? "text-neon-pink" : "text-neon-cyan"}>
                        {pred.risk_score.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </NeonCard>

          {previewRows.length > 0 && (
            <NeonCard variant="default" className="p-6">
              <h4 className="text-lg font-semibold text-foreground mb-4">Sample Records</h4>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      {Object.keys(previewRows[0]).map((key) => (
                        <TableHead key={key} className="text-muted-foreground whitespace-nowrap">
                          {key}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, idx) => (
                      <TableRow key={`preview-${idx}`} className="border-border/40">
                        {Object.keys(row).map((key) => (
                          <TableCell key={`${idx}-${key}`} className="text-sm text-foreground whitespace-nowrap">
                            {typeof row[key] === "number" ? Number(row[key]).toFixed(3) : row[key]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </NeonCard>
          )}
        </motion.div>
      )}
    </div>
  );
};
