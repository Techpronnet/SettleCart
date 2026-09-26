from pydantic_settings import BaseSettings, SettingsConfigDict
import json

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")
    
    APP_NAME: str = "SettleCart"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "change-me"
    API_V1_PREFIX: str = "/api/v1"
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "https://settle-cart.vercel.app",
        "http://13.48.219.73",
    ]
    ADMIN_REGISTRATION_SECRET: str = "settlecart-admin-secret"

    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://settlecart:settlecart@localhost:5432/settlecart"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 5
    DB_POOL_RECYCLE: int = 300
    DB_POOL_TIMEOUT: int = 30
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # JWT
    JWT_SECRET_KEY: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Paystack
    PAYSTACK_SECRET_KEY: str = ""
    PAYSTACK_PUBLIC_KEY: str = ""
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    
    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    
    # Email / SMTP
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_TLS: bool = True
    EMAILS_FROM_EMAIL: str = "noreply@settlecart.com"
    EMAILS_FROM_NAME: str = "SettleCart Marketplace"
    
    # SMS / Termii
    TERMII_API_KEY: str = ""
    TERMII_SENDER_ID: str = "SettleCart"
    TERMII_API_URL: str = "https://api.ng.termii.com/api"

    # Rate Limiting & Abuse Prevention
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_LOGIN: str = "5/minute"
    RATE_LIMIT_REGISTER: str = "10/minute"
    RATE_LIMIT_VERIFY_DELIVERY: str = "5/minute"
    RATE_LIMIT_PAYMENT_INIT: str = "10/minute"

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

settings = Settings()
