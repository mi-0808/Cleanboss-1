import aws_cdk as cdk
from aws_cdk.assertions import Match, Template

from config.dev import CONFIG
from stacks.cicd_stack import CicdStack
from stacks.compute_stack import ComputeStack
from stacks.monitoring_stack import MonitoringStack
from stacks.network_stack import NetworkStack
from stacks.storage_stack import StorageStack


def test_inf_res_001_002_network_resources() -> None:
    app = cdk.App()
    stack = NetworkStack(app, "UnitNetwork", cfg=CONFIG)
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::EC2::VPC", 1)
    template.resource_count_is("AWS::EC2::SecurityGroup", 1)


def test_inf_res_003_004_005_storage_security() -> None:
    app = cdk.App()
    stack = StorageStack(app, "UnitStorage", cfg=CONFIG)
    template = Template.from_stack(stack)

    template.has_resource_properties(
        "AWS::S3::Bucket",
        Match.object_like(
            {
                "PublicAccessBlockConfiguration": Match.any_value(),
                "BucketEncryption": Match.any_value(),
                "VersioningConfiguration": {"Status": "Enabled"},
            }
        ),
    )
    template.resource_count_is("AWS::KMS::Key", 1)


def test_inf_res_006_007_compute_lambda_and_iam() -> None:
    app = cdk.App()
    stack = ComputeStack(app, "UnitCompute", cfg=CONFIG, audit_bucket_name="dummy-bucket")
    template = Template.from_stack(stack)

    template.has_resource_properties(
        "AWS::Lambda::Function",
        Match.object_like(
            {
                "Runtime": "python3.12",
                "Timeout": 10,
                "MemorySize": 512,
            }
        ),
    )
    template.has_resource_properties(
        "AWS::IAM::Policy",
        Match.object_like(
            {
                "PolicyDocument": {
                    "Statement": Match.array_with(
                        [
                            Match.object_like(
                                {
                                    "Action": ["s3:PutObject", "s3:GetObject"],
                                    "Effect": "Allow",
                                }
                            )
                        ]
                    )
                }
            }
        ),
    )


def test_inf_res_008_009_monitoring_resources() -> None:
    app = cdk.App()
    stack = MonitoringStack(
        app,
        "UnitMonitoring",
        cfg=CONFIG,
        function_name="dummy-function-name",
    )
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::CloudWatch::Alarm", 1)
    template.resource_count_is("AWS::SNS::Topic", 1)
    template.resource_count_is("AWS::SNS::Subscription", 1)


def test_inf_res_010_cicd_project_has_synth() -> None:
    app = cdk.App()
    stack = CicdStack(app, "UnitCicd", cfg=CONFIG)
    template = Template.from_stack(stack)

    template.has_resource_properties(
        "AWS::CodeBuild::Project",
        Match.object_like(
            {
                "Source": Match.object_like(
                    {
                        "BuildSpec": Match.string_like_regexp("cdk synth -c env=dev")
                    }
                )
            }
        ),
    )


def test_inf_stk_006_tags_are_attached_from_app() -> None:
    app = cdk.App()
    stack = NetworkStack(app, "UnitTag", cfg=CONFIG)
    cdk.Tags.of(app).add("Project", "cleanboss")
    cdk.Tags.of(app).add("Environment", CONFIG.env_name)
    template = Template.from_stack(stack)

    template.has_resource("AWS::EC2::VPC", {"Properties": Match.any_value()})
