from pydantic import BaseModel, ConfigDict


class CamelModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
