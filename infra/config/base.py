from dataclasses import dataclass


@dataclass(frozen=True)
class EnvConfig:
    env_name: str
    account: str
    region: str
    cidr: str
    max_azs: int
    retention_days: int
    alarm_email: str


def load_config(env_name: str) -> EnvConfig:
    if env_name == "dev":
        from .dev import CONFIG

        return CONFIG
    if env_name == "stg":
        from .stg import CONFIG

        return CONFIG
    if env_name == "prd":
        from .prd import CONFIG

        return CONFIG
    raise ValueError(f"Unsupported env: {env_name}")
