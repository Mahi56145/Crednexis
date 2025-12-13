import { motion } from "framer-motion";
import { Activity, ShieldCheck, Sparkles, Users2 } from "lucide-react";
import { NeonCard } from "@/components/ui/NeonCard";

const insights = [
  {
    label: "Default Risk",
    value: "12.7%",
    detail: "Current portfolio exposure across revolving credit lines.",
    trend: "-3.2% vs last week",
  },
  {
    label: "Detection Lead",
    value: "17 days",
    detail: "Average lead time before delinquency is detected by lenders.",
    trend: "+5 days YoY",
  },
  {
    label: "Model Confidence",
    value: "98.5%",
    detail: "Rolling 30-day precision from production workloads.",
    trend: "+1.1% this quarter",
  },
];

const workflow = [
  {
    title: "Stream Ingest",
    description: "Real-time bureau data and first-party transactions are normalized in seconds.",
    icon: Activity,
  },
  {
    title: "Risk Engine",
    description: "Hybrid gradient + transformer models score defaults with explainable SHAP overlays.",
    icon: ShieldCheck,
  },
  {
    title: "Team Signals",
    description: "Credit, fraud, and growth teams subscribe to anomaly alerts inside their workflows.",
    icon: Users2,
  },
];

export const InsightsSection = () => {
  return (
    <section className="relative py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--neon-pink)_/_0.12),_transparent_55%)]" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="container mx-auto px-6 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-pink/15 border border-neon-pink/40">
              <Sparkles className="w-4 h-4 text-neon-pink" />
              <span className="text-sm uppercase tracking-widest text-neon-pink font-semibold">Decision Layer</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight text-foreground">
              Turn vacant dashboards into a living <span className="gradient-text-pink">credit intelligence</span> hub.
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl">
              Surface the next actionable move for risk analysts, product owners, and CX leaders in the same view.
              Insights refresh live so there is always something meaningful occupying the fold.
            </p>
            <div className="space-y-4">
              {workflow.map((step, index) => (
                <motion.div
                  key={step.title}
                  className="flex gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * index }}
                >
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neon-cyan">
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-foreground font-semibold">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="grid gap-6"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
          >
            <NeonCard variant="cyan" glow className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Portfolio Pulse</p>
                  <p className="text-3xl font-semibold text-foreground">Live telemetry</p>
                </div>
                <div className="px-4 py-2 rounded-lg bg-neon-cyan/20 text-neon-cyan text-sm font-medium">
                  Instant Sync
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {insights.map((insight) => (
                  <div key={insight.label} className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-muted-foreground">{insight.label}</p>
                    <p className="text-2xl font-semibold text-foreground">{insight.value}</p>
                    <p className="text-xs text-muted-foreground">{insight.detail}</p>
                    <p className="text-xs text-neon-cyan mt-2">{insight.trend}</p>
                  </div>
                ))}
              </div>
            </NeonCard>

            <NeonCard variant="pink" glow className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-10 h-10 text-neon-pink" />
                <div>
                  <p className="text-sm text-muted-foreground">Trusted by risk teams</p>
                  <p className="text-xl font-semibold text-foreground">Audit-ready insights in every sprint.</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Every card keeps analysts busy with real conversations—alerts, anomalies, and trend deltas—so the layout never feels empty again.
              </p>
            </NeonCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
