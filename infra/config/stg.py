from .base import EnvConfig

CONFIG = EnvConfig(
    env_name="stg",
    account="222222222222",
    region="ap-northeast-1",
    cidr="10.20.0.0/16",
    max_azs=2,
    retention_days=30,
    alarm_email="stg-alerts@example.com",
)
