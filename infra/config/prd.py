from .base import EnvConfig

CONFIG = EnvConfig(
    env_name="prd",
    account="333333333333",
    region="ap-northeast-1",
    cidr="10.30.0.0/16",
    max_azs=3,
    retention_days=90,
    alarm_email="prd-alerts@example.com",
)
