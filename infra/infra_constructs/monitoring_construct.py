from aws_cdk import Duration
from aws_cdk import aws_cloudwatch as cloudwatch
from aws_cdk import aws_cloudwatch_actions as cw_actions
from aws_cdk import aws_sns as sns
from aws_cdk import aws_sns_subscriptions as subscriptions
from constructs import Construct


class MonitoringConstruct(Construct):
    def __init__(self, scope: Construct, construct_id: str, *, alarm_email: str, fn_name: str) -> None:
        super().__init__(scope, construct_id)

        self.topic = sns.Topic(self, "AlarmTopic")
        self.topic.add_subscription(subscriptions.EmailSubscription(alarm_email))

        metric = cloudwatch.Metric(
            namespace="AWS/Lambda",
            metric_name="Errors",
            dimensions_map={"FunctionName": fn_name},
            period=Duration.minutes(5),
            statistic="sum",
        )

        self.error_alarm = cloudwatch.Alarm(
            self,
            "LambdaErrorAlarm",
            metric=metric,
            threshold=1,
            evaluation_periods=1,
            alarm_description="Lambda function error detected",
        )
        self.error_alarm.add_alarm_action(cw_actions.SnsAction(self.topic))
