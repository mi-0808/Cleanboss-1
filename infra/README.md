# cleanboss infra (AWS CDK)

## 概要
設計書に基づき、クリーンウェアチェックシステム向けのAWS基盤をPython CDKで定義します。

## スタック構成
- `NetworkStack`: VPC, Security Group
- `StorageStack`: S3 (監査ログ/画像保管), KMS
- `ComputeStack`: Lambda(API), IAM, CloudWatch Logs
- `MonitoringStack`: CloudWatch Alarm, SNS
- `CicdStack`: CodeBuildプロジェクト（最小骨格）

## 使い方
```bash
cd infra
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cdk synth -c env=dev
```

## テスト
```bash
pytest -q
```
