import aws_cdk as cdk
from aws_cdk.assertions import Match, Template

from config.dev import CONFIG
from stacks.compute_stack import ComputeStack


def test_compute_stack_has_lambda() -> None:
    app = cdk.App()
    stack = ComputeStack(app, "TestCompute", cfg=CONFIG, audit_bucket_name="dummy-bucket")
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::Lambda::Function", 1)
    template.has_resource_properties(
        "AWS::Lambda::Function",
        Match.object_like({"Timeout": 10, "MemorySize": 512}),
    )
