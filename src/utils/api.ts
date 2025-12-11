// API configuration and helper functions for CredNexis

const API_BASE_URL = "/api";

// Types
export interface PredictionFeatures {
  LIMIT_BAL: number;
  SEX: number;
  EDUCATION: number;
  MARRIAGE: number;
  AGE: number;
  PAY_0: number;
  PAY_2: number;
  PAY_3: number;
  PAY_4: number;
  PAY_5: number;
  PAY_6: number;
  BILL_AMT1: number;
  BILL_AMT2: number;
  BILL_AMT3: number;
  BILL_AMT4: number;
  BILL_AMT5: number;
  BILL_AMT6: number;
  PAY_AMT1: number;
  PAY_AMT2: number;
  PAY_AMT3: number;
  PAY_AMT4: number;
  PAY_AMT5: number;
  PAY_AMT6: number;
}

export interface SinglePredictionResponse {
  prediction: number;
  probability: number;
  risk_score: number;
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
}

// Mock data for demo mode
const generateMockPrediction = (): SinglePredictionResponse => {
  const probability = Math.random();
  return {
    prediction: probability > 0.5 ? 1 : 0,
    probability: probability,
    risk_score: probability * 100,
  };
};

const generateMockCSVPredictions = (count: number): CSVPredictionResponse => {
  const predictions: CSVPredictionResult[] = [];
  let defaulters = 0;
  let totalRisk = 0;

  for (let i = 0; i < count; i++) {
    const probability = Math.random();
    const isDefaulter = probability > 0.5;
    if (isDefaulter) defaulters++;
    totalRisk += probability * 100;

    predictions.push({
      id: i + 1,
      prediction: isDefaulter ? 1 : 0,
      probability: probability,
      risk_score: probability * 100,
    });
  }

  return {
    predictions,
    summary: {
      total: count,
      defaulters,
      non_defaulters: count - defaulters,
      average_risk: totalRisk / count,
    },
  };
};

// API Functions
export const api = {
  // Single prediction
  predictSingle: async (features: PredictionFeatures): Promise<SinglePredictionResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ features }),
      });

      if (!response.ok) {
        // Return mock data for demo
        console.log("Using demo mode for single prediction");
        return generateMockPrediction();
      }

      return response.json();
    } catch (error) {
      // Return mock data for demo
      console.log("Using demo mode for single prediction");
      return generateMockPrediction();
    }
  },

  // CSV prediction
  predictCSV: async (file: File): Promise<CSVPredictionResponse> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/predict_csv`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        // Return mock data for demo
        console.log("Using demo mode for CSV prediction");
        return generateMockCSVPredictions(Math.floor(Math.random() * 50) + 10);
      }

      return response.json();
    } catch (error) {
      // Return mock data for demo
      console.log("Using demo mode for CSV prediction");
      return generateMockCSVPredictions(Math.floor(Math.random() * 50) + 10);
    }
  },
};

// Sample prediction history data
export const samplePredictionHistory = [
  { id: 1, filename: "customers_q4.csv", date: "2024-01-15", records: 1250, avgRisk: 23.4 },
  { id: 2, filename: "new_applicants.csv", date: "2024-01-14", records: 340, avgRisk: 31.2 },
  { id: 3, filename: "portfolio_review.csv", date: "2024-01-12", records: 890, avgRisk: 18.7 },
  { id: 4, filename: "high_credit_users.csv", date: "2024-01-10", records: 156, avgRisk: 12.1 },
  { id: 5, filename: "monthly_batch.csv", date: "2024-01-08", records: 2100, avgRisk: 26.8 },
];

// Sample recent uploads
export const sampleRecentUploads = [
  { name: "Training_Data.csv", size: "2.4 MB", status: "completed" },
  { name: "Customer_Batch_01.csv", size: "892 KB", status: "completed" },
  { name: "Validation_Set.csv", size: "1.1 MB", status: "processing" },
];
