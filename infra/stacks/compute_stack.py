from aws_cdk import Stack
from constructs import Construct

from config import EnvConfig
from infra_constructs import ComputeConstruct


class ComputeStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        cfg: EnvConfig,
        audit_bucket_name: str,
        **kwargs,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)
        self.compute = ComputeConstruct(
            self,
            "Compute",
            retention_days=cfg.retention_days,
            bucket_name=audit_bucket_name,
        )
