# app/settings.py
from __future__ import annotations
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    # --- Runtime ---
    ENV: str = "prod"  # "dev" | "prod"
    SECRET_KEY: str

    # --- DB ---
    # For free Azure (SQLite on /home). Later you can swap to Azure SQL DSN.
    # Example: sqlite:////home/site/wwwroot/dev.db
    DATABASE_URL: str

    # --- Auth ---
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # --- CORS (list of origins) ---
    # In App Service, put a JSON array string: ["https://your-frontend","http://localhost:5173"]
    CORS_ORIGINS: List[str] = []

    # --- Storage ---
    # If set → use Azure Blob Storage; if empty (dev) → fallback to local filesystem.
    AZURE_STORAGE_CONNECTION_STRING: str = ""
    AZURE_BLOB_CONTAINER: str = "videos"

    # --- Dev only (ignored in prod) ---
    LOCAL_DEV_UPLOAD_DIR: str = "./uploads"

    model_config = SettingsConfigDict(
        env_file=".env",               # used locally only; App Service uses its own env vars
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # helpers
    @property
    def is_dev(self) -> bool:
        return self.ENV.lower() == "dev"

    @property
    def is_prod(self) -> bool:
        return not self.is_dev


settings = Settings()
