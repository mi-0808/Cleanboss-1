from aws_cdk import Stack
from constructs import Construct

from config import EnvConfig
from infra_constructs import MonitoringConstruct


class MonitoringStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        cfg: EnvConfig,
        function_name: str,
        **kwargs,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)
        self.monitoring = MonitoringConstruct(
            self,
            "Monitoring",
            alarm_email=cfg.alarm_email,
            fn_name=function_name,
        )
