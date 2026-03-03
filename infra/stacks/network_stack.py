from aws_cdk import Stack
from constructs import Construct

from config import EnvConfig
from infra_constructs import NetworkConstruct


class NetworkStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, *, cfg: EnvConfig, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        self.network = NetworkConstruct(self, "Network", cidr=cfg.cidr, max_azs=cfg.max_azs)
