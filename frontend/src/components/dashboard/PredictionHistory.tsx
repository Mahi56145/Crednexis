import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NeonCard } from "@/components/ui/NeonCard";
import { api, PredictionDetail, PredictionSummary } from "@/utils/api";
import { useAuth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Calendar,
  Users,
  TrendingUp,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
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

type PredictionHistoryProps = {
  demoMode?: boolean;
};

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

const demoHistorySeed = [
  { id: 1, filename: "customers_q4.csv", date: "2024-01-15", records: 1250, avgRisk: 23.4 },
  { id: 2, filename: "new_applicants.csv", date: "2024-01-14", records: 340, avgRisk: 31.2 },
  { id: 3, filename: "portfolio_review.csv", date: "2024-01-12", records: 890, avgRisk: 18.7 },
  { id: 4, filename: "high_credit_users.csv", date: "2024-01-10", records: 156, avgRisk: 12.1 },
  { id: 5, filename: "monthly_batch.csv", date: "2024-01-08", records: 2100, avgRisk: 26.8 },
];

const DEMO_SUMMARIES: PredictionSummary[] = demoHistorySeed.map((entry) => ({
  id: `demo-${entry.id}`,
  kind: "csv",
  created_at: new Date(`${entry.date}T12:00:00Z`).toISOString(),
  prediction: Math.round((entry.avgRisk / 100) * entry.records),
  probability: entry.avgRisk / 100,
  risk_score: entry.avgRisk,
  preview: {
    filename: entry.filename,
    records: entry.records,
    average_risk: entry.avgRisk,
    date: entry.date,
  },
}));

const runWithRefresh = async <T,>(
  operation: (token?: string) => Promise<T>,
  refreshFn: () => Promise<string | null>
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    const token = await refreshFn();
    if (token) {
      return operation(token);
    }
    throw error;
  }
};

const buildDemoDetail = (summary: PredictionSummary): PredictionDetail => {
  const preview = summary.preview as Record<string, unknown>;
  return {
    id: summary.id,
    kind: summary.kind,
    created_at: summary.created_at,
    features: {
      Filename: preview.filename ?? "N/A",
      Records: preview.records ?? summary.prediction,
      "Average Risk (%)": preview.average_risk ?? summary.risk_score,
    },
    prediction: summary.prediction,
    probability: summary.probability,
    risk_score: summary.risk_score,
    extra: { summary: summary.preview },
  };
};

const summaryToDetail = (item: PredictionSummary): PredictionDetail => ({
  id: item.id,
  kind: item.kind,
  created_at: item.created_at,
  features: {},
  prediction: item.prediction,
  probability: item.probability,
  risk_score: item.risk_score,
  extra: null,
});

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const formatPreview = (item: PredictionSummary): string => {
  const preview = (item.preview ?? {}) as Record<string, unknown>;
  if (item.kind === "csv") {
    const total =
      typeof preview.total === "number"
        ? preview.total
        : typeof preview.records === "number"
        ? preview.records
        : undefined;
    const avg =
      typeof preview.average_risk === "number"
        ? preview.average_risk
        : item.risk_score;
    const parts: string[] = [];
    if (typeof total === "number") {
      parts.push(`${total.toLocaleString()} rows`);
    }
    parts.push(`${avg.toFixed(1)}% avg risk`);
    return parts.join(" • ");
  }
  const entries = Object.entries(preview)
    .filter(([, value]) => typeof value === "number" || typeof value === "string")
    .slice(0, 2)
    .map(([key, value]) => `${key}: ${value}`);
  return entries.length ? entries.join(", ") : "Feature snapshot unavailable";
};

const formatPredictionLabel = (detail: PredictionDetail): string => {
  if (detail.kind === "csv") {
    return `${Math.round(detail.prediction).toLocaleString()} defaults flagged`;
  }
  return detail.prediction === 1 ? "Likely default" : "Likely non-default";
};

const extractRowFeatures = (detail: PredictionDetail): [string, unknown][] => {
  if (detail.kind === "csv") {
    const rows = (detail.features as Record<string, unknown>).rows;
    if (Array.isArray(rows) && rows.length > 0 && typeof rows[0] === "object" && rows[0] !== null) {
      return Object.entries(rows[0] as Record<string, unknown>).slice(0, 8);
    }
    return [];
  }
  return Object.entries(detail.features ?? {}).slice(0, 8);
};

export const PredictionHistory = ({ demoMode = false }: PredictionHistoryProps) => {
  const { user, refreshSession } = useAuth();
  const [history, setHistory] = useState<PredictionSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<PredictionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchHistory = useCallback(async () => {
    if (demoMode) {
      setHistory([...DEMO_SUMMARIES]);
      setSelectedId(DEMO_SUMMARIES[0]?.id ?? null);
      setSelectedDetail(DEMO_SUMMARIES[0] ? buildDemoDetail(DEMO_SUMMARIES[0]) : null);
      setLoading(false);
      setError(null);
      return;
    }

    if (!user) {
      setHistory([]);
      setSelectedId(null);
      setSelectedDetail(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const summaries = await runWithRefresh((token) => api.listPredictions(token), refreshSession);
      if (!mountedRef.current) return;
      setHistory(summaries);
      setSelectedId((current) => {
        if (current && summaries.some((item) => item.id === current)) {
          return current;
        }
        return summaries[0]?.id ?? null;
      });
    } catch (err) {
      if (!mountedRef.current) return;
      setError((err as Error).message);
      setHistory([]);
      setSelectedId(null);
      setSelectedDetail(null);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [demoMode, refreshSession, user]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedDetail(null);
      return;
    }
    const summary = history.find((item) => item.id === selectedId);
    if (!summary) {
      setSelectedDetail(null);
      return;
    }

    if (demoMode || !user) {
      setDetailLoading(false);
      setSelectedDetail(buildDemoDetail(summary));
      return;
    }

    let cancelled = false;
    const loadDetail = async () => {
      setDetailLoading(true);
      setError(null);
      try {
        const detail = await runWithRefresh((token) => api.getPrediction(summary.id, token), refreshSession);
        if (!mountedRef.current || cancelled) return;
        setSelectedDetail(detail);
      } catch (err) {
        if (!mountedRef.current || cancelled) return;
        setError((err as Error).message);
      } finally {
        if (!mountedRef.current || cancelled) return;
        setDetailLoading(false);
      }
    };
    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [demoMode, history, refreshSession, selectedId, user]);

  const featureEntries = useMemo(() => {
    if (!selectedDetail) return [];
    return extractRowFeatures(selectedDetail);
  }, [selectedDetail]);

  const summaryStats = useMemo(() => {
    if (!selectedDetail?.extra || typeof selectedDetail.extra !== "object") {
      return null;
    }
    const summary = (selectedDetail.extra as Record<string, unknown>).summary;
    if (!summary || typeof summary !== "object") {
      return null;
    }
    return summary as Record<string, number>;
  }, [selectedDetail]);

  const handleRefresh = () => {
    void fetchHistory();
  };

  const renderStatusRow = () => (
    <TableRow>
      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />
            Loading your predictions...
          </span>
        ) : (
          "No predictions yet. Run a single prediction or upload a CSV to see history here."
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <NeonCard variant="cyan" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neon-cyan/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-neon-cyan" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{history.length || 0}</div>
              <div className="text-xs text-muted-foreground">Stored Runs</div>
            </div>
          </div>
        </NeonCard>
        <NeonCard variant="pink" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neon-pink/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-neon-pink" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {history
                  .filter((item) => item.kind === "csv")
                  .reduce((acc, item) => {
                    const preview = item.preview as Record<string, unknown>;
                    const total = typeof preview.total === "number" ? preview.total : preview.records;
                    return acc + (typeof total === "number" ? total : 0);
                  }, 0)
                  .toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Batch Rows Seen</div>
            </div>
          </div>
        </NeonCard>
        <NeonCard variant="default" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-neon-cyan" />
            </div>
            <div>
              <div className="text-2xl font-bold text-neon-cyan">
                {history.length
                  ? (
                      history.reduce((acc, item) => acc + item.risk_score, 0) /
                      Math.max(history.length, 1)
                    ).toFixed(1)
                  : "98.5"}
                %
              </div>
              <div className="text-xs text-muted-foreground">Avg Risk Score</div>
            </div>
          </div>
        </NeonCard>
        <NeonCard variant="default" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {history[0]?.created_at
                  ? formatDateTime(history[0].created_at)
                  : "Active"}
              </div>
              <div className="text-xs text-muted-foreground">Last Activity</div>
            </div>
          </div>
        </NeonCard>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
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

      <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
        <NeonCard variant="default" className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h4 className="text-lg font-semibold text-foreground">Recent Predictions</h4>
              <p className="text-sm text-muted-foreground">Latest activity synced from your workspace</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Type</TableHead>
                  <TableHead className="text-muted-foreground">Created</TableHead>
                  <TableHead className="text-muted-foreground">Outcome</TableHead>
                  <TableHead className="text-muted-foreground">Risk</TableHead>
                  <TableHead className="text-muted-foreground">Snapshot</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  renderStatusRow()
                ) : (
                  history.map((item) => {
                    const isSelected = item.id === selectedId;
                    return (
                      <TableRow
                        key={item.id}
                        className={`border-border/50 transition hover:bg-glass-bg/40 cursor-pointer ${
                          isSelected ? "bg-neon-cyan/10" : ""
                        }`}
                        onClick={() => setSelectedId(item.id)}
                      >
                        <TableCell className="text-foreground font-medium">
                          <div className="flex items-center gap-2">
                            {item.kind === "csv" ? (
                              <FileText className="w-4 h-4 text-neon-cyan" />
                            ) : (
                              <Users className="w-4 h-4 text-neon-pink" />
                            )}
                            <Badge variant="outline">{item.kind === "csv" ? "Batch" : "Single"}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDateTime(item.created_at)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm text-foreground">{formatPredictionLabel(summaryToDetail(item))}</p>
                            <p className="text-xs text-muted-foreground">
                              {(item.probability * 100).toFixed(1)}% probability
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.risk_score > 25
                                ? "bg-neon-pink/20 text-neon-pink"
                                : "bg-neon-cyan/20 text-neon-cyan"
                            }`}
                          >
                            {item.risk_score.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatPreview(item)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </NeonCard>

        <NeonCard variant="default" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-foreground">Prediction Detail</h4>
            {detailLoading && <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />}
          </div>

          {selectedDetail ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{selectedDetail.kind === "csv" ? "Batch" : "Single"}</Badge>
                <span className="text-xs text-muted-foreground">{formatDateTime(selectedDetail.created_at)}</span>
              </div>
              <div>
                <p className="text-xl font-semibold text-foreground">{formatPredictionLabel(selectedDetail)}</p>
                <p className="text-sm text-muted-foreground">
                  Risk score {selectedDetail.risk_score.toFixed(1)} • Default probability {(selectedDetail.probability * 100).toFixed(1)}%
                </p>
              </div>

              {summaryStats && (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(summaryStats).map(([key, value]) => (
                    <div key={key} className="rounded-lg border border-border/40 p-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{key.replace(/_/g, " ")}</p>
                      <p className="text-lg font-semibold text-foreground">
                        {typeof value === "number"
                          ? key.includes("risk")
                            ? `${value.toFixed(1)}%`
                            : value.toLocaleString()
                          : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <h5 className="text-sm font-medium text-foreground mb-2">Feature Snapshot</h5>
                {featureEntries.length ? (
                  <dl className="grid grid-cols-2 gap-3">
                    {featureEntries.map(([key, value]) => (
                      <div key={key} className="rounded-md bg-muted/40 p-3">
                        <dt className="text-xs text-muted-foreground uppercase tracking-wide">{key}</dt>
                        <dd className="text-sm text-foreground truncate">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground">No feature data captured for this record.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select a prediction from the table to inspect its full context.</p>
          )}
        </NeonCard>
      </div>
    </div>
  );
};
