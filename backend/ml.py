import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional
import joblib
import numpy as np
from .config import Settings


def _sigmoid(values: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-values))


@dataclass
class ModelArtifact:
    feature_names: List[str]
    mean: np.ndarray
    std: np.ndarray
    weights: np.ndarray
    bias: float

    @classmethod
    def from_dict(cls, payload: Dict[str, Any]) -> "ModelArtifact":
        return cls(
            feature_names=list(payload.get("feature_names") or []),
            mean=np.array(payload.get("mean"), dtype=float),
            std=np.maximum(np.array(payload.get("std"), dtype=float), 1e-6),
            weights=np.array(payload.get("weights"), dtype=float),
            bias=float(payload.get("bias", 0.0)),
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "feature_names": self.feature_names,
            "mean": self.mean.tolist(),
            "std": self.std.tolist(),
            "weights": self.weights.tolist(),
            "bias": self.bias,
        }


def train_artifact(features: np.ndarray, target: np.ndarray, names: List[str], *, epochs: int = 4000, learning_rate: float = 0.05) -> Dict[str, Any]:
    mean = features.mean(axis=0)
    std = features.std(axis=0)
    std = np.where(std == 0, 1.0, std)
    scaled = (features - mean) / std
    weights = np.zeros(features.shape[1])
    bias = 0.0
    for _ in range(epochs):
        logits = scaled @ weights + bias
        probs = _sigmoid(logits)
        error = probs - target
        grad_w = scaled.T @ error / len(scaled)
        grad_b = error.mean()
        weights -= learning_rate * grad_w
        bias -= learning_rate * grad_b
    return {
        "feature_names": names,
        "mean": mean.tolist(),
        "std": std.tolist(),
        "weights": weights.tolist(),
        "bias": float(bias),
    }


class ModelManager:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.pipeline_path = Path(settings.model_pipeline_path)
        self.feature_names_path = Path(settings.feature_names_path)
        self.artifact = self._load_artifact()
        self.feature_names = self.artifact.feature_names
        self.last_batch: Optional[List[Dict[str, float]]] = None

    def _load_artifact(self) -> ModelArtifact:
        data = None
        if self.pipeline_path.exists():
            try:
                loaded = joblib.load(self.pipeline_path)
                if isinstance(loaded, dict):
                    data = loaded
            except Exception:
                data = None
        if not data:
            data = self._build_demo_artifact()
        if not data.get("feature_names") and self.feature_names_path.exists():
            with open(self.feature_names_path, "r", encoding="utf-8") as handle:
                names = json.load(handle)
                if isinstance(names, list):
                    data["feature_names"] = names
        if not data.get("feature_names"):
            data["feature_names"] = ["Income", "Age", "Loan", "Loan to Income"]
        return ModelArtifact.from_dict(data)

    def _build_demo_artifact(self) -> Dict[str, Any]:
        rng = np.random.default_rng(42)
        size = 1800
        incomes = rng.normal(48000, 14000, size)
        ages = rng.integers(21, 68, size)
        loans = rng.normal(9500, 4200, size)
        ratios = np.clip(loans / np.maximum(incomes, 1), 0, 3)
        features = np.column_stack((incomes, ages, loans, ratios))
        target = (ratios > 0.42).astype(float)
        return train_artifact(features, target, ["Income", "Age", "Loan", "Loan to Income"])

    def _vector_from_features(self, features: Dict[str, float]) -> np.ndarray:
        return np.array([float(features.get(name, 0.0)) for name in self.feature_names], dtype=float)

    def _normalize(self, matrix: np.ndarray) -> np.ndarray:
        return (matrix - self.artifact.mean) / self.artifact.std

    def _predict_matrix(self, matrix: np.ndarray) -> np.ndarray:
        scaled = self._normalize(matrix)
        logits = scaled @ self.artifact.weights + self.artifact.bias
        return _sigmoid(logits)

    def prepare_features(self, features: Dict[str, float]) -> np.ndarray:
        return self._vector_from_features(features).reshape(1, -1)

    def predict_single(self, features: Dict[str, float]) -> Dict[str, float]:
        frame = self.prepare_features(features)
        proba = float(self._predict_matrix(frame)[0])
        prediction = int(proba >= 0.5)
        return {
            "prediction": prediction,
            "default_probability": proba,
            "risk_score": proba * 100,
        }

    def predict_rows(self, rows: List[Dict[str, float]]) -> List[Dict[str, float]]:
        if not rows:
            return []
        matrix = np.vstack([self._vector_from_features(row) for row in rows])
        probs = self._predict_matrix(matrix)
        preds = (probs >= 0.5).astype(int)
        results = []
        for idx, proba in enumerate(probs):
            results.append(
                {
                    "id": idx + 1,
                    "prediction": int(preds[idx]),
                    "probability": float(proba),
                    "risk_score": float(proba * 100),
                }
            )
        return results

    def explain(self, features: Dict[str, float]) -> Dict[str, Any]:
        row = self._vector_from_features(features)
        scaled = self._normalize(row.reshape(1, -1))[0]
        contributions = scaled * self.artifact.weights
        mapping = {name: float(value) for name, value in zip(self.feature_names, contributions)}
        positives = sorted(
            (item for item in mapping.items() if item[1] > 0),
            key=lambda item: item[1],
            reverse=True,
        )[:5]
        negatives = sorted(
            (item for item in mapping.items() if item[1] < 0),
            key=lambda item: item[1],
        )[:5]
        probability = float(self._predict_matrix(row.reshape(1, -1))[0])
        return {
            "probability": probability,
            "shap_values": mapping,
            "top_positive": [{"feature": key, "value": value} for key, value in positives],
            "top_negative": [{"feature": key, "value": value} for key, value in negatives],
        }

    def store_batch(self, rows: List[Dict[str, float]]) -> None:
        self.last_batch = [
            {name: float(row.get(name, 0.0)) for name in self.feature_names}
            for row in rows
        ]

    def get_row_from_batch(self, index: int) -> Optional[Dict[str, float]]:
        if self.last_batch is None or index < 0 or index >= len(self.last_batch):
            return None
        return dict(self.last_batch[index])
