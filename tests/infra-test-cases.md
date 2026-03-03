# インフラストラクチャテストケース

## 1. AWSリソーステストケース
| テストケースID | AWSリソース | テストケース名 | 前提条件 | テスト条件 | 期待結果 | 優先度 |
|---------------|-------------|---------------|----------|-----------|----------|--------|
| INF-RES-001 | VPC | VPC作成確認 | `cdk synth` 実行可能 | NetworkStackテンプレート確認 | `AWS::EC2::VPC` が1件生成される | High |
| INF-RES-002 | SecurityGroup | Lambda用SG確認 | 同上 | NetworkStackテンプレート確認 | `AWS::EC2::SecurityGroup` が1件生成される | High |
| INF-RES-003 | S3 Bucket | 公開遮断確認 | 同上 | StorageStackテンプレート確認 | Public Access Blockが有効 | High |
| INF-RES-004 | S3 Bucket | 暗号化確認 | 同上 | StorageStackテンプレート確認 | KMS暗号化設定が有効 | High |
| INF-RES-005 | KMS Key | キーローテーション確認 | 同上 | StorageStackテンプレート確認 | rotation enabled | Medium |
| INF-RES-006 | Lambda | 実行設定確認 | 同上 | ComputeStackテンプレート確認 | Runtime `python3.12`, Timeout 10s, Memory 512MB | High |
| INF-RES-007 | IAM Role/Policy | 最小権限確認 | 同上 | ComputeStackテンプレート確認 | Lambda roleに `s3:GetObject/PutObject` のみ付与 | High |
| INF-RES-008 | CloudWatch Alarm | エラー監視確認 | 同上 | MonitoringStackテンプレート確認 | Lambda Errorsメトリクスのアラーム作成 | High |
| INF-RES-009 | SNS Topic | 通知経路確認 | 同上 | MonitoringStackテンプレート確認 | SNS Topic + Email subscription が作成される | Medium |
| INF-RES-010 | CodeBuild | CI基盤確認 | 同上 | CicdStackテンプレート確認 | `cdk synth` 実行を含むBuildSpecが定義される | Medium |

## 2. CDKスタックテストケース
| テストケースID | スタック名 | テストケース名 | 前提条件 | テスト条件 | 期待結果 | 優先度 |
|---------------|------------|---------------|----------|-----------|----------|--------|
| INF-STK-001 | NetworkStack | 単体Synth成功 | CDK依存導入済み | `cdk synth -c env=dev` | NetworkStackが合成成功 | High |
| INF-STK-002 | StorageStack | 単体Synth成功 | 同上 | `cdk synth -c env=dev` | StorageStackが合成成功 | High |
| INF-STK-003 | ComputeStack | Storage依存解決 | 同上 | 全体Synth時の依存関係確認 | ComputeがStorage出力参照で合成成功 | High |
| INF-STK-004 | MonitoringStack | Compute依存解決 | 同上 | 全体Synth時の依存関係確認 | MonitoringがFunctionName参照で合成成功 | High |
| INF-STK-005 | CicdStack | 環境別命名確認 | 同上 | `env=dev/stg/prd` でSynth | Project名に環境名が反映される | Medium |
| INF-STK-006 | 全スタック | タグ付け確認 | 同上 | 合成テンプレート確認 | `Project=cleanboss`,`Environment=<env>` タグが付与される | Medium |

## 3. デプロイメントテストケース
| テストケースID | デプロイメント | テストケース名 | 前提条件 | テスト条件 | 期待結果 | 優先度 |
|---------------|---------------|---------------|----------|-----------|----------|--------|
| INF-DEP-001 | devデプロイ | 初回デプロイ成功 | Bootstrap済み、認証済み | `scripts/deploy.sh dev` | 全スタックがCREATE_COMPLETE | High |
| INF-DEP-002 | dev差分確認 | 差分表示確認 | 変更あり | `scripts/diff.sh dev` | 変更リソース差分が表示される | Medium |
| INF-DEP-003 | stgデプロイ | 環境分離確認 | stgアカウント認証済み | `scripts/deploy.sh stg` | devと独立したstgスタック作成 | High |
| INF-DEP-004 | prdデプロイ | 保護設定確認 | prd認証済み | `scripts/deploy.sh prd` | prd設定（AZ数/保持日数）が反映される | High |
| INF-DEP-005 | ロールバック | 失敗時復旧確認 | 意図的に不正設定投入 | デプロイ失敗誘発 | CloudFormationがロールバックし既存稼働を維持 | Medium |
| INF-DEP-006 | 削除手順 | Destroy安全性確認 | 非本番環境 | `scripts/destroy.sh dev` | 削除可能リソースが削除される（RETAINは保持） | Medium |
