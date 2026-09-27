from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.inventory import router as inventory_router
from app.routes.intelligence import router as intelligence_router
from app.routes.crisis import router as crisis_router
from app.routes.network import router as network_router
from app.routes.explain import router as explain_router
from app.routes.crisis_briefing import router as crisis_briefing_router
from app.routes.crisis_chat import router as crisis_chat_router
from app.routes.federated import router as federated_router
from datetime import datetime, timezone
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response


app = FastAPI(
    title="ResiliCare API",
    description="AI-powered healthcare resilience and resource intelligence platform",
    version="1.0.0"
)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://resili-care-iota.vercel.app",
        "https://resilicare-992ca.web.app",
        "https://resilicare-992ca.firebaseapp.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(inventory_router)
app.include_router(intelligence_router)
app.include_router(crisis_router)
app.include_router(
    federated_router
)
app.include_router(network_router, prefix="/api")
app.include_router(explain_router, prefix="/api")

app.include_router(
    crisis_briefing_router,
    prefix="/api"
)
app.include_router(
    crisis_chat_router,
    prefix="/api"
)


@app.get("/")
def root():
    return {
        "project": "ResiliCare",
        "tagline": "Predict. Prepare. Protect.",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "success": True,
        "message": "ResiliCare backend is healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.head("/health")
def health_check_head():
    return Response(status_code=200)