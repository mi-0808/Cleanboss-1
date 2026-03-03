# 基本設計書

## 1. システム全体像・設計方針
### 1.1 目的・ゴール
- クリーンウェア着用時の人為的ミス（髪、チャック、ボタン、手袋隙間）を入室前に即時検知し、異物混入リスクを低減する。
- 作業者が迷わない短時間フロー（目標 1〜3 秒判定）で、再チェックを含む現場運用を成立させる。
- 将来的にログ分析・判定改善・チェック項目追加へ拡張できる構成にする。

### 1.2 想定ユーザー・利用シーン
- 作業者：固定カメラ前で正面に立ち、手を顔の高さに上げてチェックを実行。
- 班長/品質管理者：NG理由や再試行状況を確認し、現場是正に活用。
- 現場管理者：時間帯別・項目別の傾向を確認し、ルールや教育を改善。

### 1.3 アーキテクチャ
- 方式：Next.js（App Router）+ Supabase（Auth/DB/Storage）+ Edge/Serverless API + ONNX Runtime Web（端末推論優先）
- 推論戦略：
  - 第一段階：端末側の軽量推論（低遅延・オフライン耐性）
  - 第二段階：必要時のみサーバー再判定（しきい値近傍、品質監査用途）
- 図（テキスト）：
  - Worker Device (iPhone 16 + fixed camera)
  - → Web App (Next.js, PWA)
  - → In-browser Inference (ONNX Runtime Web)
  - → Result API (Next.js Route Handler)
  - → Supabase (PostgreSQL/RLS, optional Storage)
  - → Admin Dashboard (analytics)

### 1.4 技術スタック
| 区分 | 技術 | 理由/役割 |
|---|---|---|
| FE | Next.js 15 (App Router), React, TypeScript, Tailwind CSS | 作業者UI/管理UIを単一コードベースで提供 |
| BE | Next.js Route Handlers, Server Actions | 結果保存、集計API、管理機能 |
| AI/CV | ONNX Runtime Web, MediaPipe/姿勢補助（任意） | 端末上で低遅延推論、ポーズ補助 |
| DB | Supabase PostgreSQL | 判定結果、イベント、設定、監査ログ保存 |
| Auth | Supabase Auth | 管理者・監督者向け認証 |
| Hosting | Vercel + Supabase | サーバーレス運用とスケーラビリティ |
| Logging/Monitoring | Sentry, Supabase Logs, Vercel Analytics | 障害検知、推論失敗率、遅延監視 |

## 2. 機能構成・モジュール設計
### 2.1 機能一覧（AI実装向けに分割）
| 機能ID | 機能名 | 概要 | 入力 | 出力 | 依存 | 優先度 |
|---|---|---|---|---|---|---|
| F-01 | カメラ初期化 | 固定カメラ映像の取得とガイド表示 | カメラデバイス | プレビュー映像、姿勢ガイド | ブラウザ権限API | Must |
| F-02 | 撮影トリガー | チェック開始時のフレーム取得 | UI操作、映像 | 判定用画像/テンソル | F-01 | Must |
| F-03 | 前処理 | リサイズ、正規化、ROI切り出し | 生画像 | モデル入力テンソル | F-02 | Must |
| F-04 | 項目別推論 | 髪/チャック/ボタン/手袋隙間を推論 | 前処理データ | 項目別スコア・判定 | F-03、モデルファイル | Must |
| F-05 | 総合判定 | 項目結果を統合してOK/NG判定 | 項目別結果 | OK/NG、理由一覧 | F-04、判定ルール | Must |
| F-06 | 警告表示 | NG時に画面＋音声/警告音を出す | 判定結果 | NG理由表示、再チェック導線 | F-05 | Must |
| F-07 | 合格表示 | OK時に入室可表示 | 判定結果 | OK画面、次処理導線 | F-05 | Must |
| F-08 | 結果ログ保存 | 判定イベント、遅延、再試行回数保存 | 判定結果、メタ情報 | DBレコード | F-05、F-10 | Should |
| F-09 | 管理ダッシュボード | NG傾向、時間帯分析 | DBデータ | グラフ、一覧 | F-08、Auth | Should |
| F-10 | 権限制御 | 作業者匿名利用と管理者認証分離 | セッション情報 | アクセス制御 | Auth、RLS | Must |
| F-11 | フィードバック登録 | 誤検知/見逃し報告 | 管理者入力 | 改善キュー | F-09 | Should |
| F-12 | オフライン対応 | 通信不安定時の判定継続・後送 | 判定イベント | ローカルキュー、再送 | F-04、F-08 | Should |
| F-13 | テスト自動化 | 判定ルール、API、UI回帰テスト | テストデータ | 合否レポート | 全機能 | Must |

### 2.2 モジュール責務
| 配下 | 責務 | 主な内容 | 依存 |
|---|---|---|---|
| `app/(worker)` | 作業者UI | カメラ、開始ボタン、結果表示、再試行導線 | `components/worker`, `lib/inference` |
| `app/(admin)` | 管理UI | ログ検索、傾向分析、フィードバック登録 | `lib/db`, `lib/auth` |
| `app/api` | API層 | 判定結果保存、集計取得、ヘルスチェック | `lib/server`, Supabase |
| `components` | UI部品 | 判定カード、警告バナー、ガイド表示 | Tailwind, Zustand等 |
| `lib/inference` | 推論処理 | 前処理、モデル実行、後処理、しきい値判定 | ONNX Runtime Web |
| `lib/rules` | ルール管理 | 項目別NG条件、総合判定ロジック | DB設定、定数 |
| `lib/db` | データアクセス | Repository、トランザクション、クエリ | Supabase client |
| `lib/auth` | 認証認可 | セッション検証、ロール判定 | Supabase Auth |
| `lib/offline` | 再送制御 | IndexedDBキュー、再送ジョブ | Service Worker |
| `tests` | テスト | unit/integration/e2e | Vitest/Playwright |

### 2.3 エラーハンドリング方針
- ユーザー向けメッセージ
  - カメラ権限拒否：「カメラ利用を許可してください。管理者に連絡してください。」
  - 推論失敗：「判定に失敗しました。姿勢を整えて再実施してください。」
  - 通信失敗：「通信不安定のため一時保存しました。自動再送します。」
- ログ出力
  - フロント：エラーコード、処理時間、端末情報を構造化ログ化
  - サーバー：API失敗要因、RLS拒否、再送失敗回数を記録
- リトライ/再送
  - 推論：同一セッション内で最大2回自動再試行
  - ログ保存：指数バックオフで再送（最大5回）、失敗時はローカル保持
- 失敗時のUI
  - 全画面停止を避け、再試行ボタンとヘルプ文を常時表示
  - NG理由が不明な場合は「判定失敗（詳細コード）」を表示し管理者へ通知可能にする

## 3. データ設計
### 3.1 エンティティ一覧
| エンティティ | 主キー | 説明 |
|---|---|---|
| sites | id | 設置拠点情報 |
| devices | id | 固定カメラ端末情報 |
| check_sessions | id | 1回のチェック試行セッション |
| check_item_results | id | 項目別（髪/チャック/ボタン/手袋）判定結果 |
| check_events | id | UIイベント・警告イベント |
| user_feedbacks | id | 誤検知/見逃し報告 |
| threshold_configs | id | 項目別しきい値設定 |
| admin_users | id | 管理者ユーザー（Auth連携） |

### 3.2 テーブル設計（SQL）
- `public` スキーマ前提
- RLS方針
  - 作業者端末：`check_sessions`/`check_item_results` への `insert` のみ許可（サービスロールAPI経由を推奨）
  - 管理者：拠点単位で `select` を許可
  - 閾値設定・削除系は管理者ロール限定

#### 3.2.1 tables
```sql
create extension if not exists pgcrypto;

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id),
  device_code text not null unique,
  label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.check_sessions (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  overall_result text not null check (overall_result in ('OK','NG','ERROR')),
  ng_count int not null default 0,
  retry_count int not null default 0,
  inference_ms int,
  capture_mode text not null default 'single_shot',
  image_storage_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.check_item_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.check_sessions(id) on delete cascade,
  item_code text not null check (item_code in ('hair','zipper','buttons','glove_gap')),
  score numeric(5,4) not null,
  threshold numeric(5,4) not null,
  result text not null check (result in ('OK','NG','UNKNOWN')),
  reason_code text,
  created_at timestamptz not null default now(),
  unique(session_id, item_code)
);

create table if not exists public.check_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.check_sessions(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_feedbacks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.check_sessions(id) on delete cascade,
  feedback_type text not null check (feedback_type in ('false_positive','false_negative','other')),
  comment text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.threshold_configs (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id),
  item_code text not null check (item_code in ('hair','zipper','buttons','glove_gap')),
  threshold numeric(5,4) not null,
  effective_from timestamptz not null default now(),
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_check_sessions_device_started_at
  on public.check_sessions(device_id, started_at desc);

create index if not exists idx_check_item_results_session
  on public.check_item_results(session_id);
```

#### 3.2.2 RLS（方針例）
```sql
alter table public.check_sessions enable row level security;
alter table public.check_item_results enable row level security;
alter table public.check_events enable row level security;
alter table public.user_feedbacks enable row level security;
alter table public.threshold_configs enable row level security;

-- 管理者のみ閲覧可（実運用では site_id による絞り込みを追加）
create policy admin_select_sessions on public.check_sessions
for select using (auth.role() = 'authenticated');

-- API（service role）経由の insert を前提
create policy deny_direct_insert_sessions on public.check_sessions
for insert with check (false);
```

### 3.3 API設計（OpenAPI・最小）
```yaml
openapi: 3.0.3
info:
  title: Cleanwear Check API
  version: 0.1.0
paths:
  /api/check/execute:
    post:
      summary: 画像から判定実行（必要に応じてサーバー再判定）
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ExecuteCheckRequest'
      responses:
        '200':
          description: 判定結果
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ExecuteCheckResponse'
  /api/check/results:
    post:
      summary: 判定結果保存
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SaveResultRequest'
      responses:
        '201':
          description: 保存成功
  /api/admin/metrics:
    get:
      summary: 管理指標取得
      responses:
        '200':
          description: 集計結果
components:
  schemas:
    ItemResult:
      type: object
      required: [itemCode, score, threshold, result]
      properties:
        itemCode: { type: string, enum: [hair, zipper, buttons, glove_gap] }
        score: { type: number }
        threshold: { type: number }
        result: { type: string, enum: [OK, NG, UNKNOWN] }
        reasonCode: { type: string }
    ExecuteCheckRequest:
      type: object
      required: [deviceCode, capturedAt, imageBase64]
      properties:
        deviceCode: { type: string }
        capturedAt: { type: string, format: date-time }
        imageBase64: { type: string }
    ExecuteCheckResponse:
      type: object
      required: [overallResult, itemResults]
      properties:
        overallResult: { type: string, enum: [OK, NG, ERROR] }
        itemResults:
          type: array
          items:
            $ref: '#/components/schemas/ItemResult'
        inferenceMs: { type: integer }
    SaveResultRequest:
      type: object
      required: [deviceCode, overallResult, itemResults]
      properties:
        deviceCode: { type: string }
        overallResult: { type: string, enum: [OK, NG, ERROR] }
        retryCount: { type: integer, minimum: 0 }
        itemResults:
          type: array
          items:
            $ref: '#/components/schemas/ItemResult'
```

### 3.4 バリデーション（JSON Schema・保存API）
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "SaveResultRequest",
  "type": "object",
  "required": ["deviceCode", "overallResult", "itemResults"],
  "properties": {
    "deviceCode": { "type": "string", "minLength": 1 },
    "overallResult": { "type": "string", "enum": ["OK", "NG", "ERROR"] },
    "retryCount": { "type": "integer", "minimum": 0, "maximum": 10 },
    "itemResults": {
      "type": "array",
      "minItems": 4,
      "maxItems": 4,
      "items": {
        "type": "object",
        "required": ["itemCode", "score", "threshold", "result"],
        "properties": {
          "itemCode": { "type": "string", "enum": ["hair", "zipper", "buttons", "glove_gap"] },
          "score": { "type": "number", "minimum": 0, "maximum": 1 },
          "threshold": { "type": "number", "minimum": 0, "maximum": 1 },
          "result": { "type": "string", "enum": ["OK", "NG", "UNKNOWN"] },
          "reasonCode": { "type": "string" }
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
}
```

## 4. 実装分割・依存関係
### 4.1 フェーズ分割（AI実装単位）
| フェーズ | 実装範囲 | 成果物 | 依存 |
|---|---|---|---|
| P1 | 作業者UI雛形 + カメラ取得 | チェック画面、撮影動作 | なし |
| P2 | 推論パイプライン（ダミー可） | 4項目結果の表示 | P1 |
| P3 | 判定ルール + 警告UI/音 | OK/NG・理由・再試行導線 | P2 |
| P4 | DB設計 + 結果保存API | マイグレーション、保存処理 | P3 |
| P5 | 管理画面（一覧/集計） | NG傾向可視化 | P4 |
| P6 | オフライン再送 + 監視 | IndexedDB再送、Sentry連携 | P4 |
| P7 | テスト強化 | unit/integration/e2e整備 | P1〜P6 |

### 4.2 依存グラフ（簡易）
- `F-01 -> F-02 -> F-03 -> F-04 -> F-05 -> (F-06, F-07)`
- `F-05 -> F-08 -> F-09`
- `F-08 -> F-12`
- `F-10` は `F-09` と `F-08` の前提

## 5. 非機能設計
### 5.1 性能
- 判定時間 SLO：P95 3秒以内、P99 5秒以内
- UI応答：操作からフィードバック表示 200ms以内

### 5.2 可用性
- 通信断時はローカル判定継続、結果はキューイングして自動再送
- API障害時も作業者フローを停止させない

### 5.3 セキュリティ/プライバシー
- 画像保存は設定で明示的にONの場合のみ
- 既定は「判定結果のみ保存」、顔画像は保存しない
- 管理画面は認証必須 + 監査ログ記録

### 5.4 監視
- 主要メトリクス：判定時間、NG率、項目別NG率、ERROR率、再送失敗率
- アラート条件：ERROR率 > 3%（5分平均）、P95判定時間 > 4秒

## 6. テスト設計
| テストID | 対象 | 内容 | 合格条件 |
|---|---|---|---|
| T-01 | 判定ルール | 4項目のしきい値境界テスト | 境界条件で期待通りのOK/NG |
| T-02 | UI | NG時に理由・再試行導線が表示 | すべてのNG理由が表示される |
| T-03 | API保存 | 正常系・不正入力・重複送信 | 201/400が仕様通り |
| T-04 | RLS | 権限外アクセス拒否 | 非管理者の参照不可 |
| T-05 | オフライン | 通信断→復帰で再送 | データ欠損なしで保存 |
| T-06 | E2E | 撮影→判定→保存の一連フロー | 主要シナリオ完走 |

## 7. 確認事項・追加質問
1. 判定結果は最終的に「二値（OK/NG）」で確定ですか。それとも「注意」を含む3段階が必要ですか。
2. `手袋の隙間` のNG定義はどれですか。
   - A: 袖が見えたらNG
   - B: 肌が見えたらNG
   - C: 現場運用で別定義
3. 画像保存方針を確定してください。
   - A: 保存しない（結果のみ）
   - B: NG時のみ保存
   - C: 全件保存（保持期間指定が必要）
4. 顔画像の扱いはどれですか。
   - A: 保存禁止
   - B: マスキング後のみ可
   - C: 条件付きで可
5. 1人あたりの運用上限時間（例 5秒/10秒/20秒）を確定してください。
6. iPhone 16 固定カメラの設置条件（距離・高さ・画角）を固定値で決められますか。
7. 管理画面で個人識別は必要ですか（不要 / 社員証連携 / 未定）。
8. 入室ゲート連動（OK時に解錠）を今回スコープに含めますか。
9. オフライン運用時、何件まで端末内キュー保存を許容しますか（例 500/1000件）。
10. 4項目の優先度（アラート強度）を設定しますか（例 髪 > 手袋 > チャック > ボタン）。
