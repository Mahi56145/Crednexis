# CredNexis AI Platform

Full-stack credit default prediction platform featuring a FastAPI backend, React + Vite frontend, Google Sign-In, JWT session management, SHAP explainability, CSV batch predictions, and PostgreSQL persistence.

## Architecture

- **Backend**: FastAPI, SQLAlchemy, JWT auth, Google Identity verification, SHAP explanations, CSV batch scoring, pytest suite.
- **Frontend**: React + Vite + Tailwind + shadcn UI, Google Identity Services login ﬂow, protected dashboard with explainability overlays and CSV insights.
- **ML Assets**: `backend/train_and_save.py` reproduces the notebook pipeline (credit default dataset from YBIFoundation). Outputs are stored under `backend/models/`.
- **DevOps**: Dockerfiles for frontend and backend, docker-compose stack with PostgreSQL, Makefile helpers, GitHub Actions CI for tests and image builds.

## Environment Variables

| Name | Description | Default |
|------|-------------|---------|
| `DATABASE_URL` | SQLAlchemy DSN for FastAPI | `postgresql+psycopg2://crednexis:crednexis@db:5432/crednexis` |
| `JWT_SECRET` | Secret for signing access tokens | _required_ |
| `GOOGLE_CLIENT_ID` | OAuth client ID from Google Cloud console | _required_ |
| `MODEL_PIPELINE_PATH` | Path to trained pipeline | `backend/models/best_model.joblib` |
| `FEATURES_JSON` | Path to JSON feature list | `backend/models/feature_names.json` |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Database bootstrap credentials | `crednexis` |
| `VITE_API_BASE_URL` | Frontend API origin (dev server) | `http://localhost:8000` |
| `VITE_GOOGLE_CLIENT_ID` | Client ID injected into Vite build | _required_ |
| `REACT_APP_API_BASE_URL` | Frontend API origin (legacy Docker env) | `/api` |
| `REACT_APP_GOOGLE_CLIENT_ID` | Legacy env for Docker nginx image | _required_ |

Copy `.env.example` to `.env` and update the required secrets before running anything sensitive.

## Local Development

```bash
# Back-end
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload

# Front-end
cd frontend
npm install
npm run dev
```

During local dev, create `frontend/.env.local` (or export vars) with `VITE_API_BASE_URL=http://localhost:8000` and `VITE_GOOGLE_CLIENT_ID=<your-client-id>` so the Vite dev server talks to FastAPI and shows the Google button. The backend exposes:

- `POST /auth/google`, `/auth/refresh`, `/auth/logout`
- `POST /predict`, `/predict_csv`, `/explain`
- `GET /health`

## Google OAuth Setup

1. Visit [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Create OAuth Client ID → Web Application.
2. Add authorized JavaScript origins: `http://localhost:3000` and your production domain.
3. Add authorized redirect URIs: `http://localhost:3000` (Google Identity Services is popup-based; no custom redirect needed but must list the origin).
4. Copy the generated client ID into both `GOOGLE_CLIENT_ID` and `REACT_APP_GOOGLE_CLIENT_ID`.
5. For production, add your public domain and update `.env` + deployment secrets. Rotate the client secret regularly.

## Training the Model

```bash
make train
```

This downloads the dataset used in `credit_card_default_final.ipynb`, trains logistic and random forest models, selects the best by ROC AUC, and saves:

- `backend/models/best_model.joblib`
- `backend/models/scaler_standard.joblib`
- `backend/models/feature_names.json`

## Testing

```bash
make test
```

The pytest suite mocks Google verification and exercises:

- `/auth/google` login + refresh/logout flow
- `/predict`
- `/explain`
- `/predict_csv`
- `/health`

Use `backend/tests/fixtures/sample.csv` for manual smoke tests.

## Docker & Compose

```bash
make build              # docker-compose build
make up                 # start db + backend + frontend
```

Services:

- `frontend` (nginx → static assets, `/api` proxy to backend)
- `backend` (FastAPI + ML pipeline)
- `db` (Postgres 15)

After the stack is up:

- `http://localhost:8000/health` should return status metadata.
- `http://localhost:3000` serves the SPA (Login page includes the Google button).

## CI Pipeline

`.github/workflows/ci.yaml` runs on every push/PR against `main`:

1. Install backend dependencies and run pytest.
2. Build the backend Docker image (placeholder for pushing to a registry).
3. Install frontend dependencies, run the Vite build, and upload the artifact.

## Security and Production Notes

- Use long, random `JWT_SECRET` values and rotate them with zero downtime procedures.
- Prefer HTTPS everywhere and move tokens into Secure, HttpOnly cookies behind a reverse proxy.
- Replace the in-memory rate limiter with Redis or another distributed store before scaling.
- Wire observability (OpenTelemetry, Sentry) and audit logging for auth + predictions.
- Run database migrations (Alembic) for long-lived environments.
- Enforce CSV size + schema checks before writing to disk, and sanitize logs of PII.

## Acceptance Checklist

- `docker-compose up --build` launches db, backend, frontend. Health endpoint returns `{"status":"ok", ...}`.
- Google login exchanges ID token for JWT (documented above). Dashboard shows neon explainability cards when authenticated and a demo banner otherwise.
- `POST /predict` returns probability + risk score. `POST /predict_csv` returns summary + preview rows. `POST /explain` returns SHAP values for authorized users.
- `pytest backend/tests` passes locally and in CI.
- `make train` regenerates the ML assets from the published dataset.

See the final checklist in the assistant response for verification steps.
