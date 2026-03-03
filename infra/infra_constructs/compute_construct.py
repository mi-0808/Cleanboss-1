from aws_cdk import Duration
from aws_cdk import aws_iam as iam
from aws_cdk import aws_lambda as _lambda
from aws_cdk import aws_logs as logs
from constructs import Construct


def _retention_from_days(days: int) -> logs.RetentionDays:
    mapping = {
        1: logs.RetentionDays.ONE_DAY,
        3: logs.RetentionDays.THREE_DAYS,
        5: logs.RetentionDays.FIVE_DAYS,
        7: logs.RetentionDays.ONE_WEEK,
        14: logs.RetentionDays.TWO_WEEKS,
        30: logs.RetentionDays.ONE_MONTH,
        90: logs.RetentionDays.THREE_MONTHS,
    }
    return mapping.get(days, logs.RetentionDays.ONE_MONTH)


class ComputeConstruct(Construct):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        retention_days: int,
        bucket_name: str,
    ) -> None:
        super().__init__(scope, construct_id)

        self.function_role = iam.Role(
            self,
            "ApiLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ],
        )

        self.function_role.add_to_policy(
            iam.PolicyStatement(
                actions=["s3:PutObject", "s3:GetObject"],
                resources=[f"arn:aws:s3:::{bucket_name}/*"],
            )
        )

        self.api_function = _lambda.Function(
            self,
            "CheckApiFunction",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="index.handler",
            timeout=Duration.seconds(10),
            memory_size=512,
            role=self.function_role,
            code=_lambda.Code.from_inline(
                "def handler(event, context):\n"
                "    return {'statusCode': 200, 'body': '{\"status\":\"ok\"}'}"
            ),
            environment={"AUDIT_BUCKET": bucket_name},
            log_retention=_retention_from_days(retention_days),
        )
