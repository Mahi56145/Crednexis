import csv
from io import StringIO
from typing import List, Optional
from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from auth import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    hash_password,
    hash_token,
    verify_google_token,
    verify_password,
)
from config import get_settings
from database import Base, engine, get_db
from models import User, PredictionRecord
from ml import ModelManager
from rate_limit import RateLimiter
from schemas import (
    CSVPredictionResponse,
    CSVPredictionItem,
    CSVSummary,
    ExplainRequest,
    ExplainResponse,
    GoogleAuthRequest,
    HealthResponse,
    LoginRequest,
    LogoutRequest,
    PredictionRequest,
    PredictionResponse,
    PredictionSummary,
    PredictionDetail,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)

settings = get_settings()
Base.metadata.create_all(bind=engine)
model_manager = ModelManager(settings)
rate_limiter = RateLimiter(settings.rate_limit_requests, settings.rate_limit_window_seconds)
bearer = HTTPBearer(auto_error=False)
app = FastAPI(title="CredNexis API", version="1.0.0")

def _ensure_password_column() -> None:
    with engine.connect() as conn:
        result = conn.exec_driver_sql("PRAGMA table_info(users)")
        columns = {row[1] for row in result.fetchall()}
        if "password_hash" not in columns:
            conn.exec_driver_sql("ALTER TABLE users ADD COLUMN password_hash VARCHAR")
            conn.commit()

_ensure_password_column()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing credentials")
    data = decode_access_token(credentials.credentials, settings)
    user = db.query(User).filter(User.id == data.get("sub")).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if credentials is None:
        return None
    try:
        data = decode_access_token(credentials.credentials, settings)
    except HTTPException:
        return None
    return db.query(User).filter(User.id == data.get("sub")).first()


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", pipeline_present=settings.pipeline_exists, database=settings.database_url)


@app.post("/auth/google", response_model=TokenResponse)
def auth_google(payload: GoogleAuthRequest, db: Session = Depends(get_db)) -> TokenResponse:
    profile = verify_google_token(payload.id_token, settings.google_client_id)
    email = profile.get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email required")
    google_sub = profile.get("sub")
    user = db.query(User).filter(User.google_sub == google_sub).first()
    if not user:
        user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email)
    user.google_sub = google_sub
    user.name = profile.get("name")
    user.picture = profile.get("picture")
    raw_refresh, hashed_refresh = create_refresh_token(settings)
    user.refresh_token_hash = hashed_refresh
    db.add(user)
    db.commit()
    db.refresh(user)
    access_token = create_access_token(user.id, user.email, settings)
    return TokenResponse(access_token=access_token, refresh_token=raw_refresh, user=user)


@app.post("/auth/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    hashed_password = hash_password(payload.password)
    user = User(email=payload.email.lower(), name=payload.name, password_hash=hashed_password)
    raw_refresh, hashed_refresh = create_refresh_token(settings)
    user.refresh_token_hash = hashed_refresh
    db.add(user)
    db.commit()
    db.refresh(user)
    access_token = create_access_token(user.id, user.email, settings)
    return TokenResponse(access_token=access_token, refresh_token=raw_refresh, user=user)


@app.post("/auth/login", response_model=TokenResponse)
def password_login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    raw_refresh, hashed_refresh = create_refresh_token(settings)
    user.refresh_token_hash = hashed_refresh
    db.commit()
    db.refresh(user)
    access_token = create_access_token(user.id, user.email, settings)
    return TokenResponse(access_token=access_token, refresh_token=raw_refresh, user=user)


@app.post("/auth/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    hashed = hash_token(payload.refresh_token)
    user = db.query(User).filter(User.refresh_token_hash == hashed).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    new_refresh, hashed_refresh = create_refresh_token(settings)
    user.refresh_token_hash = hashed_refresh
    db.commit()
    db.refresh(user)
    access_token = create_access_token(user.id, user.email, settings)
    return TokenResponse(access_token=access_token, refresh_token=new_refresh, user=user)


@app.post("/auth/logout")
def logout(
    payload: LogoutRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    hashed = hash_token(payload.refresh_token)
    if user.refresh_token_hash != hashed:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token mismatch")
    user.refresh_token_hash = None
    db.commit()
    return {"status": "ok"}


def _assert_anonymous_limit(request: Request, user: Optional[User]):
    if user is not None:
        return
    client_host = request.client.host if request.client else "anonymous"
    rate_limiter.assert_allowed(client_host)


def _normalize_header(header: str) -> str:
    return "".join(header.strip().lower().replace("_", "").split())


@app.post("/predict", response_model=PredictionResponse)
def predict(
    payload: PredictionRequest,
    request: Request,
    user: Optional[User] = Depends(get_optional_user),
) -> PredictionResponse:
    _assert_anonymous_limit(request, user)
    result = model_manager.predict_single(payload.features)
    explanation = None
    if user is not None:
        try:
            explanation = model_manager.explain(payload.features)
        except Exception:
            explanation = None
    if user:
        record = PredictionRecord(
            user_id=user.id,
            kind="single",
            features=payload.features,
            prediction=result["prediction"],
            probability=result["default_probability"],
            risk_score=result["risk_score"],
            extra={"explanation": explanation} if explanation else None,
        )
        db = next(get_db())
        db.add(record)
        db.commit()
        db.refresh(record)
    return PredictionResponse(
        prediction=result["prediction"],
        default_probability=result["default_probability"],
        risk_score=result["risk_score"],
        explanation=explanation,
    )


@app.post("/predict_csv", response_model=CSVPredictionResponse)
async def predict_csv(
    request: Request,
    file: UploadFile = File(...),
    user: Optional[User] = Depends(get_optional_user),
) -> CSVPredictionResponse:
    _assert_anonymous_limit(request, user)
    raw_text = (await file.read()).decode("utf-8")
    reader = csv.DictReader(StringIO(raw_text))
    if reader.fieldnames is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CSV must include a header row")
    header_map = {_normalize_header(name): name for name in reader.fieldnames if name}
    column_lookup = {}
    missing = []
    for feature in model_manager.feature_names:
        normalized = _normalize_header(feature)
        actual = header_map.get(normalized)
        if not actual:
            missing.append(feature)
        else:
            column_lookup[feature] = actual
    if missing:
        expected = ", ".join(model_manager.feature_names)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing columns: {', '.join(missing)}. Expected headers include: {expected}",
        )
    ordered_rows = []
    for row_index, row in enumerate(reader, start=2):
        parsed_row = {}
        for feature, column in column_lookup.items():
            raw_value = row.get(column, "")
            value = (raw_value.strip() if isinstance(raw_value, str) else raw_value) or 0
            try:
                parsed_row[feature] = float(value)
            except (TypeError, ValueError) as exc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid numeric value '{raw_value}' in column '{column}' on row {row_index}",
                ) from exc
        ordered_rows.append(parsed_row)
    predictions = model_manager.predict_rows(ordered_rows)
    model_manager.store_batch(ordered_rows)
    defaulters = len([item for item in predictions if item["prediction"] == 1])
    avg_risk = sum(item["risk_score"] for item in predictions) / max(len(predictions), 1)
    preview_size = min(settings.csv_preview_rows, len(predictions))
    preview_rows = []
    for idx in range(preview_size):
        row = dict(ordered_rows[idx])
        row.update(
            {
                "prediction": predictions[idx]["prediction"],
                "default_probability": predictions[idx]["probability"],
                "risk_score": predictions[idx]["risk_score"],
            }
        )
        preview_rows.append(row)

    response = CSVPredictionResponse(
        predictions=[CSVPredictionItem(**item) for item in predictions],
        summary=CSVSummary(
            total=len(predictions),
            defaulters=defaulters,
            non_defaulters=len(predictions) - defaulters,
            average_risk=avg_risk,
        ),
        preview_rows=preview_rows,
    )
    if user:
        record = PredictionRecord(
            user_id=user.id,
            kind="csv",
            features={"rows": ordered_rows[: settings.csv_preview_rows]},
            prediction=float(defaulters),
            probability=float(avg_risk / 100 if len(predictions) else 0.0),
            risk_score=float(avg_risk),
            extra={"summary": response.summary.dict(), "preview": response.preview_rows},
        )
        db = next(get_db())
        db.add(record)
        db.commit()
        db.refresh(record)
    return response


@app.get("/predictions", response_model=List[PredictionSummary])
def list_predictions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    records = (
        db.query(PredictionRecord)
        .filter(PredictionRecord.user_id == user.id)
        .order_by(PredictionRecord.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        PredictionSummary(
            id=record.id,
            kind=record.kind,
            created_at=record.created_at.isoformat(),
            prediction=record.prediction,
            probability=record.probability,
            risk_score=record.risk_score,
            preview=(record.extra or {}).get("summary") or record.features,
        )
        for record in records
    ]


@app.get("/predictions/{record_id}", response_model=PredictionDetail)
def get_prediction(record_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = (
        db.query(PredictionRecord)
        .filter(PredictionRecord.id == record_id, PredictionRecord.user_id == user.id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")
    return PredictionDetail(
        id=record.id,
        kind=record.kind,
        created_at=record.created_at.isoformat(),
        features=record.features,
        prediction=record.prediction,
        probability=record.probability,
        risk_score=record.risk_score,
        extra=record.extra,
    )


@app.post("/explain", response_model=ExplainResponse)
def explain(payload: ExplainRequest, user: User = Depends(get_current_user)) -> ExplainResponse:
    features = payload.features
    if features is None and payload.row_index is not None:
        features = model_manager.get_row_from_batch(payload.row_index)
    if features is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Features required")
    try:
        explanation = model_manager.explain(features)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Explainability unavailable") from exc
    return ExplainResponse(
        probability=explanation["probability"],
        shap_values=explanation["shap_values"],
        top_positive=explanation["top_positive"],
        top_negative=explanation["top_negative"],
    )
