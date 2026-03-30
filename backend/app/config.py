from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "CoolCity API"
    city_name: str = Field(default="CoolCity Demo", alias="COOLCITY_CITY_NAME")
    db_path: str = Field(default="../database/coolcity.db", alias="COOLCITY_DB_PATH")
    cors_origins: str = Field(default="http://localhost:3000,http://localhost:3001,http://localhost:3003", alias="COOLCITY_CORS_ORIGINS")
    api_port: int = Field(default=8000, alias="COOLCITY_API_PORT")

    @property
    def resolved_db_path(self) -> Path:
        backend_dir = Path(__file__).resolve().parents[1]
        return (backend_dir / self.db_path).resolve()

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
