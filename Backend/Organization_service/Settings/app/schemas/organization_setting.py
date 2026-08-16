from typing import Any, Dict
from pydantic import BaseModel, Field, field_validator


class SettingItemResponse(BaseModel):
    key: str
    value: Any


class SettingsResponse(BaseModel):
    settings: Dict[str, Any] = Field(
        default_factory=dict,
        description="Dictionary of organization configuration key-value pairs"
    )


class SettingsUpdateRequest(BaseModel):
    settings: Dict[str, Any] = Field(
        ...,
        description="Key-value mapping of settings to update or set"
    )

    @field_validator("settings")
    @classmethod
    def validate_settings_not_empty(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        if not v:
            raise ValueError("Settings dictionary cannot be empty")
        for key in v.keys():
            if not isinstance(key, str) or not key.strip():
                raise ValueError("Setting key must be a non-empty string")
        return v


class SingleSettingUpdateRequest(BaseModel):
    value: Any = Field(..., description="The new value for the configuration setting")


class SettingsUpdateResponse(BaseModel):
    message: str = "Settings updated successfully"
    settings: Dict[str, Any]


class SingleSettingUpdateResponse(BaseModel):
    message: str = "Setting updated successfully"
    key: str
    value: Any
