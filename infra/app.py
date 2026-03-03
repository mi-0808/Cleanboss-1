#!/usr/bin/env python3
import aws_cdk as cdk

from config import load_config
from stacks import CicdStack, ComputeStack, MonitoringStack, NetworkStack, StorageStack


def main() -> None:
    app = cdk.App()
    env_name = app.node.try_get_context("env") or "dev"
    cfg = load_config(env_name)

    aws_env = cdk.Environment(account=cfg.account, region=cfg.region)

    network = NetworkStack(app, f"CleanbossNetwork-{cfg.env_name}", cfg=cfg, env=aws_env)
    storage = StorageStack(app, f"CleanbossStorage-{cfg.env_name}", cfg=cfg, env=aws_env)
    compute = ComputeStack(
        app,
        f"CleanbossCompute-{cfg.env_name}",
        cfg=cfg,
        audit_bucket_name=storage.storage.audit_bucket.bucket_name,
        env=aws_env,
    )
    monitoring = MonitoringStack(
        app,
        f"CleanbossMonitoring-{cfg.env_name}",
        cfg=cfg,
        function_name=compute.compute.api_function.function_name,
        env=aws_env,
    )
    cicd = CicdStack(app, f"CleanbossCicd-{cfg.env_name}", cfg=cfg, env=aws_env)

    compute.add_dependency(storage)
    monitoring.add_dependency(compute)
    cicd.add_dependency(network)

    cdk.Tags.of(app).add("Project", "cleanboss")
    cdk.Tags.of(app).add("Environment", cfg.env_name)

    app.synth()


if __name__ == "__main__":
    main()
