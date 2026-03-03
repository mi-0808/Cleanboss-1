from aws_cdk import Duration, RemovalPolicy
from aws_cdk import aws_kms as kms
from aws_cdk import aws_s3 as s3
from constructs import Construct


class StorageConstruct(Construct):
    def __init__(self, scope: Construct, construct_id: str, *, env_name: str) -> None:
        super().__init__(scope, construct_id)

        self.kms_key = kms.Key(
            self,
            "DataKey",
            enable_key_rotation=True,
            alias=f"alias/cleanboss-{env_name}",
        )

        self.audit_bucket = s3.Bucket(
            self,
            "AuditBucket",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            enforce_ssl=True,
            lifecycle_rules=[s3.LifecycleRule(expiration=Duration.days(365))],
            versioned=True,
            removal_policy=RemovalPolicy.RETAIN,
        )
