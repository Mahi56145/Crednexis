from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, EmailStr, constr

class UserOut(BaseModel):
    id: str
    email: str
    name: Optional[str]
    picture: Optional[str]

    class Config:
        orm_mode = True

class HealthResponse(BaseModel):
    status: str
    pipeline_present: bool
    database: str

class PredictionRequest(BaseModel):
    features: Dict[str, float]

class PredictionResponse(BaseModel):
    prediction: int
    default_probability: float
    risk_score: float
    explanation: Optional[Dict[str, Any]] = None

class CSVSummary(BaseModel):
    total: int
    defaulters: int
    non_defaulters: int
    average_risk: float

class CSVPredictionItem(BaseModel):
    id: int
    prediction: int
    probability: float
    risk_score: float

class CSVPredictionResponse(BaseModel):
    predictions: List[CSVPredictionItem]
    summary: CSVSummary
    preview_rows: List[Dict[str, Any]]

class ExplainRequest(BaseModel):
    features: Optional[Dict[str, float]] = None
    row_index: Optional[int] = Field(default=None, ge=0)

class ExplanationAttribution(BaseModel):
    feature: str
    value: float


class ExplainResponse(BaseModel):
    probability: float
    shap_values: Dict[str, float]
    top_positive: List[ExplanationAttribution]
    top_negative: List[ExplanationAttribution]


class PredictionSummary(BaseModel):
    id: str
    kind: str
    created_at: str
    prediction: float
    probability: float
    risk_score: float
    preview: Dict[str, Any]


class PredictionDetail(BaseModel):
    id: str
    kind: str
    created_at: str
    features: Dict[str, Any]
    prediction: float
    probability: float
    risk_score: float
    extra: Optional[Dict[str, Any]] = None

class GoogleAuthRequest(BaseModel):
    id_token: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserOut

class RefreshRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: constr(min_length=8)
    name: Optional[str]


class LoginRequest(BaseModel):
    email: EmailStr
    password: constr(min_length=8)
