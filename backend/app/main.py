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

app = FastAPI(
    title="ResiliCare API",
    description="AI-powered healthcare resilience and resource intelligence platform",
    version="1.0.0"
)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
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
def health():
    return {"status": "healthy"}