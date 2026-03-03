# cleanwear-check

[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)
[![Deploy Dev](https://github.com/OWNER/REPO/actions/workflows/deploy-dev.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/deploy-dev.yml)
[![Deploy Prod](https://github.com/OWNER/REPO/actions/workflows/deploy-prod.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/deploy-prod.yml)
[![CDK Diff](https://github.com/OWNER/REPO/actions/workflows/cdk-diff.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/cdk-diff.yml)

クリーンウェア着用ミス検知システムの初期実装です。

## セットアップ

```bash
npm install
npm run dev
```

## 実装済み

- 作業者画面 `/worker`
- 判定実行 API `POST /api/check/execute`（モック推論）
- 結果保存 API `POST /api/check/results`（zod バリデーション付き）
- 判定ルールとバリデーションのユニットテスト

## 次の実装

- 実カメラ接続（MediaDevices API）
- ONNX Runtime Web による実推論
- Supabase 永続化とRLS適用
- 管理画面 `/admin`

## CI/CD

- ワークフロー定義: `.github/workflows/`
- 設定手順: [docs/CICD.md](/Users/matsuiminato/Desktop/cleanboss/docs/CICD.md)
