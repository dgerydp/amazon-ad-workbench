from pydantic import BaseModel


class LingxingTestRequest(BaseModel):
    app_id: str | None = None
    app_secret: str | None = None
    base_url: str | None = None

