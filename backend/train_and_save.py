import argparse
import csv
import json
from io import StringIO
from pathlib import Path
from urllib.request import urlopen
import joblib
import numpy as np

DATASET_URL = "https://github.com/YBIFoundation/Dataset/raw/3474d607bd2bca1aa1a54cf44b99df4ce8ba2073/Credit%20Default.csv"
FEATURES = ["Income", "Age", "Loan", "Loan to Income"]
TARGET = "Default"

def read_source(path_or_url: str) -> str:
    if path_or_url.startswith("http://") or path_or_url.startswith("https://"):
        with urlopen(path_or_url, timeout=30) as response:
            return response.read().decode("utf-8")
    return Path(path_or_url).read_text(encoding="utf-8")


def load_dataset(source: str) -> tuple[np.ndarray, np.ndarray]:
    text = read_source(source)
    reader = csv.DictReader(StringIO(text))
    if reader.fieldnames is None:
        raise ValueError("Dataset is missing a header row")
    missing = [col for col in FEATURES + [TARGET] if col not in reader.fieldnames]
    if missing:
        raise ValueError(f"Dataset missing columns: {missing}")
    feature_rows = []
    target = []
    for row in reader:
        try:
            feature_rows.append([float(row.get(name, 0) or 0) for name in FEATURES])
            target.append(float(row.get(TARGET, 0) or 0))
        except ValueError as exc:
            raise ValueError(f"Unable to parse row: {row}") from exc
    return np.array(feature_rows, dtype=float), np.array(target, dtype=float)


def train_artifact(features: np.ndarray, labels: np.ndarray, *, epochs: int = 4000, learning_rate: float = 0.05) -> dict:
    mean = features.mean(axis=0)
    std = features.std(axis=0)
    std = np.where(std == 0, 1.0, std)
    scaled = (features - mean) / std
    weights = np.zeros(features.shape[1])
    bias = 0.0
    for _ in range(epochs):
        logits = scaled @ weights + bias
        probs = 1.0 / (1.0 + np.exp(-logits))
        error = probs - labels
        grad_w = scaled.T @ error / len(scaled)
        grad_b = error.mean()
        weights -= learning_rate * grad_w
        bias -= learning_rate * grad_b
    return {
        "feature_names": FEATURES,
        "mean": mean.tolist(),
        "std": std.tolist(),
        "weights": weights.tolist(),
        "bias": float(bias),
    }


def save_artifacts(artifact: dict, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, output_dir / "best_model.joblib")
    with open(output_dir / "feature_names.json", "w", encoding="utf-8") as handle:
        json.dump(FEATURES, handle)


def main():
    parser = argparse.ArgumentParser(description="Train credit default model")
    parser.add_argument("--source", default=DATASET_URL)
    parser.add_argument("--output", default="backend/models")
    parser.add_argument("--epochs", type=int, default=4000)
    parser.add_argument("--learning-rate", type=float, default=0.05)
    args = parser.parse_args()
    features, labels = load_dataset(args.source)
    if not len(features):
        raise RuntimeError("Dataset is empty")
    artifact = train_artifact(features, labels, epochs=args.epochs, learning_rate=args.learning_rate)
    save_artifacts(artifact, Path(args.output))
    print("Artifacts saved to", args.output)


if __name__ == "__main__":
    main()
