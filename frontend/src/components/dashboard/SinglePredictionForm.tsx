import { useState } from "react";
import { motion } from "framer-motion";
import { NeonCard } from "@/components/ui/NeonCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { RiskScoreRing } from "@/components/ui/RiskScoreRing";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, PredictionFeatures, SinglePredictionResponse, ExplainResponse } from "@/utils/api";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/auth";

type SinglePredictionFormProps = {
  demoMode?: boolean;
};

const defaultFeatures: PredictionFeatures = {
  Income: 52000,
  Age: 36,
  Loan: 12000,
  "Loan to Income": 0.23,
};

const featureFields: { key: keyof PredictionFeatures; label: string; step: number }[] = [
  { key: "Income", label: "Annual Income ($)", step: 1000 },
  { key: "Age", label: "Age", step: 1 },
  { key: "Loan", label: "Loan Amount ($)", step: 500 },
  { key: "Loan to Income", label: "Loan / Income Ratio", step: 0.01 },
];

const ExplainCard = ({ explanation }: { explanation: ExplainResponse }) => (
  <div className="grid md:grid-cols-2 gap-4">
    <NeonCard variant="cyan" className="p-4">
      <h4 className="text-sm font-semibold text-foreground mb-3">Top risk drivers</h4>
      <ul className="space-y-2 text-sm">
        {explanation.top_positive.map((item) => (
          <li key={`pos-${item.feature}`} className="flex justify-between text-neon-pink">
            <span>{item.feature}</span>
            <span>{item.value.toFixed(3)}</span>
          </li>
        ))}
      </ul>
    </NeonCard>
    <NeonCard variant="default" className="p-4">
      <h4 className="text-sm font-semibold text-foreground mb-3">Protective signals</h4>
      <ul className="space-y-2 text-sm">
        {explanation.top_negative.map((item) => (
          <li key={`neg-${item.feature}`} className="flex justify-between text-neon-cyan">
            <span>{item.feature}</span>
            <span>{item.value.toFixed(3)}</span>
          </li>
        ))}
      </ul>
    </NeonCard>
  </div>
);

export const SinglePredictionForm = ({ demoMode = false }: SinglePredictionFormProps) => {
  const { user, accessToken, refreshSession } = useAuth();
  const [features, setFeatures] = useState<PredictionFeatures>(defaultFeatures);
  const [result, setResult] = useState<SinglePredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<ExplainResponse | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);

  const handleChange = (key: keyof PredictionFeatures, value: string) => {
    setFeatures((prev) => ({
      ...prev,
      [key]: parseFloat(value) || 0,
    }));
  };

  const handlePredict = async () => {
    setLoading(true);
    try {
      const prediction = await api.predictSingle(features);
      setResult(prediction);
      setExplanation(prediction.explanation ?? null);
      toast({
        title: "Prediction complete",
        description: `Risk score ${prediction.risk_score.toFixed(1)}%`,
      });
    } catch (error: any) {
      toast({
        title: "Prediction failed",
        description: error?.message || "Unable to reach inference API",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async () => {
    if (!result || !user) return;
    setExplainLoading(true);
    try {
      let token = accessToken;
      if (!token) {
        token = await refreshSession();
        if (!token) {
          throw new Error("Session expired. Please log in again.");
        }
      }
      const data = await api.explain(features, token);
      setExplanation(data);
    } catch (error: any) {
      toast({
        title: "Explainability unavailable",
        description: error?.message || "Try refreshing your session",
        variant: "destructive",
      });
    } finally {
      setExplainLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {result && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
          <NeonCard variant={result.risk_score > 50 ? "pink" : "cyan"} glow className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <p className="text-sm uppercase tracking-wider text-muted-foreground">Instant verdict</p>
                <h3 className="text-2xl font-bold text-foreground">{result.prediction === 1 ? "High default propensity" : "Low default propensity"}</h3>
                <p className="text-muted-foreground">Probability {(result.default_probability * 100).toFixed(2)}%</p>
              </div>
              <RiskScoreRing score={result.risk_score} size={160} strokeWidth={10} />
            </div>
            {user && (
              <div className="flex flex-col sm:flex-row gap-4">
                <NeonButton variant="outline-cyan" onClick={handleExplain} disabled={explainLoading}>
                  {explainLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh SHAP insights"}
                </NeonButton>
              </div>
            )}
            {explanation && <ExplainCard explanation={explanation} />}
          </NeonCard>
        </motion.div>
      )}

      <NeonCard variant="default" className="p-6">
        <div className="grid md:grid-cols-2 gap-4">
          {featureFields.map((field) => (
            <div key={field.key as string} className="space-y-2">
              <Label htmlFor={`${field.key}`} className="text-sm text-muted-foreground">
                {field.label}
              </Label>
              <Input
                id={`${field.key}`}
                type="number"
                step={field.step}
                value={features[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="bg-background/50 border-border focus:border-neon-cyan"
              />
            </div>
          ))}
        </div>
      </NeonCard>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <NeonButton variant="pink" size="lg" onClick={handlePredict} disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Scoring
            </span>
          ) : (
            "Run prediction"
          )}
        </NeonButton>
        {demoMode && (
          <NeonButton variant="outline-cyan" size="lg" onClick={() => setFeatures(defaultFeatures)} disabled={loading}>
            Reset sample
          </NeonButton>
        )}
      </div>
    </div>
  );
};
