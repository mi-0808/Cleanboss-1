import aws_cdk as cdk
from aws_cdk.assertions import Match, Template

from config.dev import CONFIG
from stacks.storage_stack import StorageStack


def test_storage_bucket_encryption_and_ssl() -> None:
    app = cdk.App()
    stack = StorageStack(app, "TestStorage", cfg=CONFIG)
    template = Template.from_stack(stack)

    template.has_resource_properties(
        "AWS::S3::Bucket",
        Match.object_like(
            {
                "BucketEncryption": Match.any_value(),
                "VersioningConfiguration": {"Status": "Enabled"},
            }
        ),
    )
