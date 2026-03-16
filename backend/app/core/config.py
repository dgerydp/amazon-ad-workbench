from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Amazon Ad Workbench"
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8080
    database_url: str = "sqlite:///./amazon_ad_workbench.db"
    redis_url: str = "redis://localhost:6379/0"
    default_timezone: str = "Asia/Shanghai"
    secret_key: str = "change-me"
    lingxing_app_id: str = ""
    lingxing_app_secret: str = ""
    lingxing_base_url: str = "https://openapi.lingxing.com"
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
