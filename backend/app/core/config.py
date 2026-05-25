from functools import lru_cache

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Belay Properties API"
    app_env: str = "development"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"
    # Comma-separated origins in env (BACKEND_CORS_ORIGINS). Do not use list[str] here:
    # pydantic-settings tries json.loads() on env values for list fields before validators run.
    cors_allowed_origins: str = Field(
        default="http://localhost:5173,http://localhost:5174",
        validation_alias="BACKEND_CORS_ORIGINS",
    )
    database_url: str = "postgresql+psycopg://belay:belay_dev_password@localhost:5432/belay_properties"
    jwt_secret_key: str = "change-this-before-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    default_currency: str = "ETB"
    quote_expiry_days: int = 7
    max_upload_size_mb: int = 5
    enable_ocr_import: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @computed_field
    @property
    def backend_cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
