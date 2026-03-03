import aws_cdk as cdk
from aws_cdk.assertions import Template

from config.dev import CONFIG
from stacks.network_stack import NetworkStack


def test_network_stack_has_vpc_and_security_group() -> None:
    app = cdk.App()
    stack = NetworkStack(app, "TestNetwork", cfg=CONFIG)
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::EC2::VPC", 1)
    template.resource_count_is("AWS::EC2::SecurityGroup", 1)
