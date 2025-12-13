import { getApiBaseUrl, getStoredAccessToken } from "@/auth";

const API_BASE_URL = getApiBaseUrl();

export interface PredictionFeatures {
  Income: number;
  Age: number;
  Loan: number;
  "Loan to Income": number;
}

export interface SinglePredictionResponse {
  prediction: number;
  default_probability: number;
  risk_score: number;
  explanation?: ExplainResponse;
}

export interface CSVPredictionResult {
  id: number;
  prediction: number;
  probability: number;
  risk_score: number;
}

export interface CSVPredictionResponse {
  predictions: CSVPredictionResult[];
  summary: {
    total: number;
    defaulters: number;
    non_defaulters: number;
    average_risk: number;
  };
  preview_rows: Record<string, string | number>[];
}

export interface ExplainResponse {
  probability: number;
  shap_values: Record<string, number>;
  top_positive: { feature: string; value: number }[];
  top_negative: { feature: string; value: number }[];
}

export interface PredictionSummary {
  id: string;
  kind: "single" | "csv";
  created_at: string;
  prediction: number;
  probability: number;
  risk_score: number;
  preview: Record<string, unknown>;
}

export interface PredictionDetail {
  id: string;
  kind: "single" | "csv";
  created_at: string;
  features: Record<string, unknown>;
  prediction: number;
  probability: number;
  risk_score: number;
  extra?: Record<string, unknown> | null;
}

const withAuthHeaders = (options: RequestInit, token?: string) => {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return { ...options, headers };
};

const request = async <T>(path: string, options: RequestInit = {}, token?: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, withAuthHeaders(options, token ?? getStoredAccessToken() ?? undefined));
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.detail || "Request failed");
  }
  return response.json();
};

export const api = {
  predictSingle: (features: PredictionFeatures, token?: string) =>
    request<SinglePredictionResponse>("/predict", { method: "POST", body: JSON.stringify({ features }) }, token),
  predictCSV: (file: File, token?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<CSVPredictionResponse>("/predict_csv", { method: "POST", body: formData }, token);
  },
  explain: (features: PredictionFeatures, token?: string) =>
    request<ExplainResponse>("/explain", { method: "POST", body: JSON.stringify({ features }) }, token),
  listPredictions: (token?: string) => request<PredictionSummary[]>("/predictions", {}, token),
  getPrediction: (id: string, token?: string) => request<PredictionDetail>(`/predictions/${id}`, {}, token),
};
