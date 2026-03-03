# アプリケーション単体テスト実行ガイド

## 対象
- `app/tests/*.unit.test.ts`
- テストケース対応: `APP-FE-*`, `APP-DATA-*`

## 前提条件
- Node.js 20+
- pnpm 9+

## セットアップ（pnpm）
```bash
cd /Users/matsuiminato/Desktop/cleanboss
pnpm install
```

## 実行方法
```bash
# 全テスト
pnpm test

# app/tests のみ
pnpm exec vitest run app/tests

# 特定ファイル
pnpm exec vitest run app/tests/check-api.unit.test.ts

# カバレッジ付き
pnpm exec vitest run --coverage
```

## 補足
- このプロジェクトは `vitest.config.ts` で `tests/` と `app/tests/` の両方を実行対象にしています。
- APIルート単体テストでは `NextRequest` を軽量モックで置き換えています。
