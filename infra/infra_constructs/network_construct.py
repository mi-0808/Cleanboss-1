from aws_cdk import aws_ec2 as ec2
from constructs import Construct


class NetworkConstruct(Construct):
    def __init__(self, scope: Construct, construct_id: str, *, cidr: str, max_azs: int) -> None:
        super().__init__(scope, construct_id)

        self.vpc = ec2.Vpc(
            self,
            "Vpc",
            ip_addresses=ec2.IpAddresses.cidr(cidr),
            max_azs=max_azs,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(name="public", subnet_type=ec2.SubnetType.PUBLIC),
                ec2.SubnetConfiguration(
                    name="private-egress", subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
                ),
            ],
        )

        self.lambda_sg = ec2.SecurityGroup(
            self,
            "LambdaSecurityGroup",
            vpc=self.vpc,
            allow_all_outbound=True,
            description="Security group for cleanboss Lambda",
        )
