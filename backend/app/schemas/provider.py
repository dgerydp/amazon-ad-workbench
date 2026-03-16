from pydantic import BaseModel


class ProviderTestRequest(BaseModel):
    provider: str
    base_url: str | None = None
    api_key: str | None = None
    model: str | None = None


class ProviderConfigCreate(BaseModel):
    provider: str
    base_url: str | None = None
    model: str | None = None
    api_key: str | None = None
    enabled: bool = True

