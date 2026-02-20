from fastapi import FastAPI
from app.api.router import router

app = FastAPI(
    title="Project API",
    version="0.1.0",
)

app.include_router(router, prefix="/api")


