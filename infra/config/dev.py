from .base import EnvConfig

CONFIG = EnvConfig(
    env_name="dev",
    account="111111111111",
    region="ap-northeast-1",
    cidr="10.10.0.0/16",
    max_azs=2,
    retention_days=14,
    alarm_email="dev-alerts@example.com",
)
