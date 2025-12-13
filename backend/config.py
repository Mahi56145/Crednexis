from functools import lru_cache
from pathlib import Path
from pydantic import BaseSettings, Field
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    database_url: str = Field(default="sqlite:///./dev.db")
    jwt_secret: str = Field(default="change-me")
    jwt_algorithm: str = Field(default="HS256")
    access_token_expires_minutes: int = Field(default=15)
    refresh_token_expires_days: int = Field(default=14)
    google_client_id: str = Field(default="")
    model_pipeline_path: str = Field(default="backend/models/best_model.joblib")
    feature_names_path: str = Field(default="backend/models/feature_names.json", env="FEATURES_JSON")
    shap_background_sample: int = Field(default=200)
    rate_limit_requests: int = Field(default=30)
    rate_limit_window_seconds: int = Field(default=60)
    csv_preview_rows: int = Field(default=20)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def pipeline_exists(self) -> bool:
        return Path(self.model_pipeline_path).exists()


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
