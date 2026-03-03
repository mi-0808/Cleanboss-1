from aws_cdk import CfnOutput, Stack
from constructs import Construct

from config import EnvConfig
from infra_constructs import StorageConstruct


class StorageStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, *, cfg: EnvConfig, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        self.storage = StorageConstruct(self, "Storage", env_name=cfg.env_name)

        CfnOutput(
            self,
            "AppBucketName",
            value=self.storage.audit_bucket.bucket_name,
            description="S3 bucket name for application static assets",
            export_name=f"cleanboss-{cfg.env_name}-app-bucket-name",
        )
