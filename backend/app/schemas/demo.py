from pydantic import BaseModel


class DemoBootstrapRequest(BaseModel):
    reset: bool = False
    use_ai: bool = False
    provider: str | None = None
    model: str | None = None
