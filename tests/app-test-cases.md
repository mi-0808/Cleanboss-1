# アプリケーションテストケース

## 1. フロントエンド機能テストケース
| テストケースID | 機能名 | テストケース名 | 前提条件 | 入力 | 期待結果 | 優先度 | テスト種別 |
|---------------|--------|---------------|----------|------|----------|--------|------------|
| APP-FE-001 | カメラ初期化 | 作業者画面の初期表示 | `/worker` にアクセス可能 | 画面表示 | タイトル・説明・チェック開始ボタン・プレビュー領域が表示される | High | 正常系 |
| APP-FE-002 | 撮影トリガー | チェック開始で判定API呼出 | 判定APIが稼働 | 「チェック開始」クリック | `POST /api/check/execute` が1回呼ばれる | High | 正常系 |
| APP-FE-003 | 判定結果表示 | OK結果の表示 | 判定APIがOKを返す | 「チェック開始」クリック | 「入室OK」と各項目結果が表示される | High | 正常系 |
| APP-FE-004 | 判定結果表示 | NG結果の表示 | 判定APIがNGを返す | 「チェック開始」クリック | 「NG」とNG項目理由が表示される | High | 正常系 |
| APP-FE-005 | 進行状態表示 | 判定中のローディング表示 | 判定API応答を遅延 | 「チェック開始」クリック | ボタン表示が「判定中...」に変わり多重送信防止される | Medium | 正常系 |
| APP-FE-006 | 例外処理 | 判定API失敗時のエラー表示 | 判定APIが5xxを返す | 「チェック開始」クリック | エラーメッセージが表示され画面が操作可能状態を維持する | High | 異常系 |
| APP-FE-007 | 結果保存連携 | 判定後に結果保存APIを呼ぶ | 結果保存APIが稼働 | 判定成功 | `POST /api/check/results` が呼ばれ `deviceCode/overallResult/itemResults` が送信される | High | 正常系 |
| APP-FE-008 | 入力バリデーション | itemResults件数不正を拒否 | APIに直接アクセス可能 | itemResults 1件で送信 | `400 VALIDATION_ERROR` が返る | High | 異常系 |
| APP-FE-009 | 判定ルール | 全項目OKでoverall OK | `judgeOverall` 単体実行可能 | 4項目すべてOK | overallResultが`OK`、ngReasons空 | High | 単体 |
| APP-FE-010 | 判定ルール | 1項目NGでoverall NG | `judgeOverall` 単体実行可能 | zipperのみNG | overallResultが`NG`、理由に`zipper_*`が含まれる | High | 単体 |

## 2. データ層テストケース
| テストケースID | データエンティティ | テストケース名 | 前提条件 | 入力データ | 期待結果 | 優先度 |
|---------------|-------------------|---------------|----------|-----------|----------|--------|
| APP-DATA-001 | SaveResultRequest | 正常ペイロード受理 | zodスキーマが利用可能 | deviceCode, overallResult, itemResults(4件) | バリデーション成功 | High |
| APP-DATA-002 | SaveResultRequest | score下限違反 | zodスキーマが利用可能 | score=-0.1 | バリデーション失敗 | High |
| APP-DATA-003 | SaveResultRequest | score上限違反 | zodスキーマが利用可能 | score=1.1 | バリデーション失敗 | High |
| APP-DATA-004 | SaveResultRequest | itemCode列挙外 | zodスキーマが利用可能 | itemCode="mask" | バリデーション失敗 | High |
| APP-DATA-005 | SaveResultRequest | retryCount範囲外 | zodスキーマが利用可能 | retryCount=11 | バリデーション失敗 | Medium |
| APP-DATA-006 | check_sessions相当 | 保存APIでID発番 | 結果保存APIが稼働 | 正常リクエスト | `201` とUUID形式の `id` が返る | Medium |

## 3. UI/UXテストケース
| テストケースID | 画面名 | テストケース名 | 前提条件 | 操作手順 | 期待結果 | 優先度 |
|---------------|--------|---------------|----------|----------|----------|--------|
| APP-UX-001 | 作業者画面 `/worker` | 1画面完結導線 | 画面アクセス可能 | 画面表示→チェック開始→結果確認 | 画面遷移なしで「撮影→判定→次行動」が完結 | High |
| APP-UX-002 | 作業者画面 `/worker` | NG時の再実施理解性 | NG結果が返る | 判定実行 | NG理由が読み取れ、再実行可能なUI状態 | High |
| APP-UX-003 | 作業者画面 `/worker` | 日本語メッセージ可読性 | 画面アクセス可能 | 主要文言確認 | 操作文言が日本語で統一される | Medium |
| APP-UX-004 | 作業者画面 `/worker` | モバイル表示確認 | iPhone 16相当ビューポート | 画面表示 | 主要ボタン・結果表示が横スクロールなしで操作可能 | High |
| APP-UX-005 | 作業者画面 `/worker` | エラー時継続運用 | APIエラーを発生 | 判定実行 | エラー表示後も再試行できる | High |
| APP-UX-006 | ブラウザ互換 | Safari/Chrome挙動確認 | iOS Safari, Desktop Chrome準備 | 判定操作一連実施 | 主要機能（開始/結果表示）が両ブラウザで動作 | Medium |
