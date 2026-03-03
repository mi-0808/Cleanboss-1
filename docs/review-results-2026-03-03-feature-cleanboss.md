# コードレビュー結果

## レビュー情報
- レビュー対象: feature-cleanboss（ワークフロー/テスト/CDK構成）
- レビュー実施日: 2026-03-03
- レビュー担当者: Codex
- 対象ブランチ: 不明（ローカルワークスペース）

## Findings（重大度順）

1. **[Critical] `deploy-infra` の job outputs 参照式が誤っており、後続ジョブへ値が渡らない**  
   - 対象: [deploy-dev.yml](/Users/matsuiminato/Desktop/cleanboss/.github/workflows/deploy-dev.yml#L25), [deploy-prod.yml](/Users/matsuiminato/Desktop/cleanboss/.github/workflows/deploy-prod.yml#L35)  
   - 根拠: `app_bucket: ${{ steps.outputs.outputs.app_bucket }}` は `steps.<id>.outputs.<name>` 構文ではなく常に空になる。正しくは `steps.outputs.app_bucket`。  
   - 影響: `deploy-app` のバリデーションで必ず失敗し、デプロイパイプラインが停止する。  
   - 改善案: `outputs` セクションを `app_bucket: ${{ steps.outputs.app_bucket }}` / `distribution_id: ${{ steps.outputs.distribution_id }}` に修正。

2. **[High] アプリ配布ディレクトリが現実のビルド成果物と不整合で、CDが成立しない**  
   - 対象: [deploy-dev.yml](/Users/matsuiminato/Desktop/cleanboss/.github/workflows/deploy-dev.yml#L14), [deploy-prod.yml](/Users/matsuiminato/Desktop/cleanboss/.github/workflows/deploy-prod.yml#L15)  
   - 根拠: `APP_DIST_DIR: app/out` を前提としているが、現行実装は Next.js であり `next export` 未設定。`app/out` は通常生成されない。  
   - 影響: `Validate deploy target` で毎回失敗。  
   - 改善案: 静的配布を採るなら build/export ステップ追加。SSR運用なら S3 sync を廃止し、Vercel/コンテナ/Lambda 配備方式へ変更。

3. **[High] CloudFormation Outputs 依存が未実装で、バケット/Distribution取得が常時空になる**  
   - 対象: [deploy-dev.yml](/Users/matsuiminato/Desktop/cleanboss/.github/workflows/deploy-dev.yml#L64), [deploy-prod.yml](/Users/matsuiminato/Desktop/cleanboss/.github/workflows/deploy-prod.yml#L74), [storage_stack.py](/Users/matsuiminato/Desktop/cleanboss/infra/stacks/storage_stack.py#L1)  
   - 根拠: ワークフローは `AppBucketName`, `CloudFrontDistributionId` を期待するが、CDKスタック側に `CfnOutput` 定義がない。  
   - 影響: アプリデプロイ段階で停止。CloudFront invalidationも実行不可。  
   - 改善案: Storage/CDN関連スタックに `CfnOutput` を追加し、命名をワークフローと一致させる。

4. **[Medium] `cdk-diff` が差分ありで常時failするため、運用方針と不一致の可能性**  
   - 対象: [cdk-diff.yml](/Users/matsuiminato/Desktop/cleanboss/.github/workflows/cdk-diff.yml#L74)  
   - 根拠: `cdk diff` が差分検知時に非0となり、そのままジョブ失敗。  
   - 影響: 「差分可視化」目的のPRでもチェックが赤になり、マージブロックになる。  
   - 改善案: ブロック意図がなければ `continue-on-error` または失敗条件を実行エラー時のみに限定。

## スコア詳細（10点満点）

### アプリケーション層（フロントエンド）
- 可読性: 8/10
- 一貫性: 8/10
- 機能・ロジック: 7/10
- エラーハンドリング: 7/10
- セキュリティ: 6/10
- パフォーマンス: 6/10
- テスト: 8/10
- ユーザビリティ・アクセシビリティ: 6/10
- ドキュメント: 8/10
- アプリケーション層小計: **64/90**

### インフラ層（AWS CDK）
- インフラ設計: 7/10
- CDKコード品質: 7/10
- セキュリティ: 7/10
- 監視・運用: 6/10
- テスト: 8/10
- インフラ層小計: **35/50**

### AI駆動開発・最終確認
- AIコード品質: 7/10
- 可観測性: 5/10
- デプロイ前: 4/10
- 文書化: 8/10
- 小計: **24/40**

## 総合評価
- 合計: **123/180点**
- 10点満点換算: **6.8/10点**
- 評価グレード: **C（改善必要）**

## 主要な改善点
1. `deploy-dev.yml` / `deploy-prod.yml` の job outputs 構文修正（最優先）
2. CDK側に `CfnOutput` を追加し、ワークフローと接続
3. アプリ配布方式（`app/out`）と実装方式（Next.js）を一致させる

## 承認可否
- [ ] 承認
- [ ] 条件付き承認
- [x] 要修正（再レビュー必要）
