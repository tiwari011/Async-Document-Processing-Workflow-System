from pydantic_settings import BaseSettings 

class Settings(BaseSettings):   
    DATABASE_URL: str
    REDIS_URL: str
    CELERY_BROKER_URL: str
    UPLOAD_DIR: str = "uploads"

    class Config:
        env_file = ".env"


settings = Settings()