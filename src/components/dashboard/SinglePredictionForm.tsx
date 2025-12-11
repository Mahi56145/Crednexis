import { useState } from "react";
import { motion } from "framer-motion";
import { NeonCard } from "@/components/ui/NeonCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { RiskScoreRing } from "@/components/ui/RiskScoreRing";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, PredictionFeatures, SinglePredictionResponse } from "@/utils/api";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const defaultFeatures: PredictionFeatures = {
  LIMIT_BAL: 50000,
  SEX: 1,
  EDUCATION: 2,
  MARRIAGE: 1,
  AGE: 35,
  PAY_0: 0,
  PAY_2: 0,
  PAY_3: 0,
  PAY_4: 0,
  PAY_5: 0,
  PAY_6: 0,
  BILL_AMT1: 10000,
  BILL_AMT2: 9500,
  BILL_AMT3: 9000,
  BILL_AMT4: 8500,
  BILL_AMT5: 8000,
  BILL_AMT6: 7500,
  PAY_AMT1: 1000,
  PAY_AMT2: 1000,
  PAY_AMT3: 1000,
  PAY_AMT4: 1000,
  PAY_AMT5: 1000,
  PAY_AMT6: 1000,
};

export const SinglePredictionForm = () => {
  const [features, setFeatures] = useState<PredictionFeatures>(defaultFeatures);
  const [result, setResult] = useState<SinglePredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);

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
      toast({
        title: "Prediction Complete",
        description: `Risk Score: ${prediction.risk_score.toFixed(1)}%`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get prediction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputGroups = [
    {
      title: "Basic Information",
      fields: [
        { key: "LIMIT_BAL", label: "Credit Limit", step: 1000 },
        { key: "SEX", label: "Sex (1=Male, 2=Female)", step: 1 },
        { key: "EDUCATION", label: "Education (1-4)", step: 1 },
        { key: "MARRIAGE", label: "Marriage (1-3)", step: 1 },
        { key: "AGE", label: "Age", step: 1 },
      ],
    },
    {
      title: "Payment Status (Past 6 Months)",
      fields: [
        { key: "PAY_0", label: "Month 1", step: 1 },
        { key: "PAY_2", label: "Month 2", step: 1 },
        { key: "PAY_3", label: "Month 3", step: 1 },
        { key: "PAY_4", label: "Month 4", step: 1 },
        { key: "PAY_5", label: "Month 5", step: 1 },
        { key: "PAY_6", label: "Month 6", step: 1 },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Result Display */}
      {result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <NeonCard variant={result.risk_score > 50 ? "pink" : "cyan"} glow className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold text-foreground mb-2">Prediction Result</h3>
                <p className="text-muted-foreground">
                  {result.prediction === 1 
                    ? "High risk of default detected" 
                    : "Low risk of default"
                  }
                </p>
              </div>
              <RiskScoreRing score={result.risk_score} size={160} strokeWidth={10} />
            </div>
          </NeonCard>
        </motion.div>
      )}

      {/* Input Form */}
      <div className="grid md:grid-cols-2 gap-6">
        {inputGroups.map((group) => (
          <NeonCard key={group.title} variant="default" className="p-6">
            <h4 className="text-lg font-semibold text-foreground mb-4">{group.title}</h4>
            <div className="grid grid-cols-2 gap-4">
              {group.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key} className="text-sm text-muted-foreground">
                    {field.label}
                  </Label>
                  <Input
                    id={field.key}
                    type="number"
                    step={field.step}
                    value={features[field.key as keyof PredictionFeatures]}
                    onChange={(e) => handleChange(field.key as keyof PredictionFeatures, e.target.value)}
                    className="bg-background/50 border-border focus:border-neon-cyan"
                  />
                </div>
              ))}
            </div>
          </NeonCard>
        ))}
      </div>

      {/* Predict Button */}
      <div className="flex justify-center">
        <NeonButton
          variant="pink"
          size="lg"
          onClick={handlePredict}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Run Prediction"
          )}
        </NeonButton>
      </div>
    </div>
  );
};
