from aws_cdk import Stack
from aws_cdk import aws_codebuild as codebuild
from constructs import Construct

from config import EnvConfig


class CicdStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, *, cfg: EnvConfig, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        codebuild.Project(
            self,
            "InfraSynthProject",
            project_name=f"cleanboss-{cfg.env_name}-infra-synth",
            environment=codebuild.BuildEnvironment(
                build_image=codebuild.LinuxBuildImage.STANDARD_7_0,
            ),
            build_spec=codebuild.BuildSpec.from_object(
                {
                    "version": "0.2",
                    "phases": {
                        "install": {
                            "commands": [
                                "python -m pip install --upgrade pip",
                                "pip install -r requirements.txt",
                                "npm install -g aws-cdk",
                            ]
                        },
                        "build": {"commands": ["cdk synth -c env=%s" % cfg.env_name]},
                    },
                }
            ),
        )
