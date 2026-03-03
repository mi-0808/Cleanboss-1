<!-- file: design/requirements.md -->

# 要件定義書：クリーンウェア着用ミス検知・警告システム

## 1. システム目的・概要（全体像）
### 1.1 目的
クリーンウェア着用現場における人為的ミスを未然に防ぎ、異物混入リスクや不良発生リスクを低減する。

### 1.2 解決したい課題
入室前の更衣・着用チェックが属人的／抜け漏れが起きやすい。特に以下の不備を検知し、発見次第、即時に警告する。
- 髪の毛が頭巾（フード）に完全に入っていない
- 首元の肌の露出がある（隙間がある）
- 手袋装着に隙間がある（袖と手袋の境界の露出など）

### 1.3 想定ユースケース（例）
- 更衣室〜クリーンルーム入室口で、作業者が所定位置に立つ
- カメラ（iPhone）が画像を取得
  //自撮りしたデータを読み込ませるほうが楽、、、、
  //プロトなら画像でわかるんやあったらええやん
- AI推論により不備の有無を判定
- 不備があれば画面と音で警告、再チェックを促す
  -画面では項目を強調する、警告の音を出す実装をお願いするます
- 合格なら「入室OK」を表示

---

## 2. 要件分析・整理（主要構成要素）
### 2.1 想定ユーザー
- 作業者（クリーンウェア着用者）
- 班長/品質管理者（運用管理・ログ確認）
- 現場管理者（運用ルール策定・KPI管理）

### 2.2 機能要件（Must / Should）
#### Must（必須）
1) 画像取得（カメラ入力）
2) 3項目の検知（髪/首元の隙間/手袋の隙間）
3) 判定結果の表示（OK/NG、NG理由）
4) 警告（視覚＋音、問題解消の行動提示）
5) 最低限の運用（現場で迷わないUI、手順が短い）

#### Should（できれば）
6) ログ保存（誰が・いつ・何でNGだったか、再試行回数）
7) 管理画面（検知率、NG傾向、時間帯別など）
8) 誤検知/見逃しのフィードバック（学習データ改善の入口）
9) オフライン/ネットワーク不安定時の運用（ローカル推論等）

### 2.3 非機能要件（重要）
- **速度**：判定は数秒以内（目標：1〜3秒）
- **精度**：現場運用できるレベル（誤検知を確実に検出できる）
- **操作性**：作業者が直感で分かる（日本語、色、音、NGだった場合の問題を解決するための行動提示）
- **安全性**：個人情報・顔の扱い（保存方針、マスキング、同意）
- **環境耐性**：照明条件、反射、画角、背景、ウェア色の影響を想定
- **拡張性**：チェック項目追加（靴・マスク等）に耐える設計

---

## 3. キーワード抽出（クライアント要望からの重要語）
- クリーンウェア / 更衣室 / 入室前
- 人為的ミス防止 / 属人化解消
- 髪の毛（頭巾内）/ チャック / ボタン / 手袋の隙間
- 検知 / 警告 / 再チェック
- 現場運用（短時間・迷わないUI）

---

## 4. 情報ギャップ（不足情報）と技術的論点
### 4.1 不足情報（現時点で決めきれない点）
- 出てきたらタスの丸

### 4.2 予測される技術的制約・課題
- **照明/影/反射**で髪の毛や隙間の見え方が変わる
- **手袋の隙間**は高難度（画角・距離・袖の形で判定が変動）
- **ボタン/チャック**は服のしわや角度で検出が不安定になり得る
- 推論方式：ルールベース（姿勢・位置合わせ）＋軽量CVモデルの組み合わせが現実的な可能性
- 学習データ：現場のウェア・人物・姿勢に寄せたデータが必要

---

## 5. 要件分析と確認事項（質問リスト）
※ここは回答しやすいように「選択式＋自由記述」を混ぜています。

### 5.1 運用・環境
1) 設置場所は「更衣室内（クリーンルーム前）」で確定
2) 他者が対象の作業者を主に上半身を中心とし、手を挙げた状態を写真に撮る
3) 1人あたり許容チェック時間は10秒
4) 照明は一定

### 5.2 端末・カメラ
5) 利用する端末はiPhone 16
6) 固定したカメラを利用
7) 1台により作業者がカメラの前で手を顔の高さまで上げて判定

### 5.3 判定仕様（重要）
8) 優先度（肌の露出を最優先に）
9) 袖口は肌が見えたらNG
10) 判定は「OK/NGの二値」でよい

### 5.4 データ・セキュリティ
11) 判定ログは保存しません
12) 顔が写る場合、マスキングで保存します
13) 将来的にICタグによる管理をします

---

## 6. UI設計（案）
### 6.1 UI方針
- 1画面完結：**「撮影 → 判定 → 次の行動」**が迷わない
- 大文字・短文・アイコンで瞬時に理解
- NG時は「どこがダメか」を箇条書きで明示し、再撮影ボタンを大きく
- 作業者向け画面と、管理者向け画面は分ける（Step2以降で拡張）

### 6.2 画面一覧（最小）
- ①チェック画面（作業者用）：カメラ映像＋「チェック開始」
- ②結果画面（作業者用）：OK/NG、NG理由、やり直し、（必要なら手順ガイド）
- ③管理画面（任意/Step2以降）：今日のNG件数、内訳、時間帯、個人別（識別する場合）

---

## 7. UIアーティファクト（HTML + CSS モック）
※デザイン検討用の静的モック（フロント実装前のたたき台）です。

```html
<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>クリーンウェアチェック</title>
  <style>
    :root{
      --bg:#0b1020;
      --card:#121a33;
      --text:#e9ecf5;
      --muted:#aab2d5;
      --ok:#2dd4bf;
      --ng:#fb7185;
      --warn:#fbbf24;
      --line:rgba(255,255,255,.12);
      --btn:#1f2a55;
    }
    *{box-sizing:border-box;}
    body{
      margin:0;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
      background: radial-gradient(1200px 600px at 30% 10%, #1b2a6b 0%, transparent 60%),
                  radial-gradient(900px 500px at 80% 20%, #1b6b5e 0%, transparent 55%),
                  var(--bg);
      color:var(--text);
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:20px;
    }
    .app{
      width:min(980px, 100%);
      display:grid;
      grid-template-columns: 1.25fr .75fr;
      gap:16px;
    }
    .card{
      background: rgba(18,26,51,.92);
      border:1px solid var(--line);
      border-radius:18px;
      box-shadow: 0 12px 40px rgba(0,0,0,.35);
      overflow:hidden;
    }
    .header{
      padding:16px 18px;
      border-bottom:1px solid var(--line);
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
    }
    .title{
      font-size:18px;
      font-weight:700;
      letter-spacing:.02em;
    }
    .badge{
      font-size:12px;
      padding:6px 10px;
      border-radius:999px;
      border:1px solid var(--line);
      color:var(--muted);
      background: rgba(255,255,255,.04);
      white-space:nowrap;
    }
    .main{
      padding:16px;
      display:grid;
      gap:14px;
    }
    .video{
      border:1px dashed rgba(255,255,255,.25);
      border-radius:16px;
      aspect-ratio: 16 / 10;
      display:flex;
      align-items:center;
      justify-content:center;
      color:var(--muted);
      background: rgba(0,0,0,.18);
      position:relative;
      overflow:hidden;
    }
    .video .hint{
      position:absolute;
      bottom:10px;
      left:10px;
      right:10px;
      font-size:12px;
      background: rgba(0,0,0,.35);
      border:1px solid rgba(255,255,255,.12);
      padding:10px 12px;
      border-radius:12px;
    }
    .grid{
      display:grid;
      grid-template-columns: 1fr 1fr;
      gap:10px;
    }
    .check{
      padding:12px 12px;
      border:1px solid var(--line);
      border-radius:14px;
      background: rgba(255,255,255,.03);
      display:flex;
      align-items:flex-start;
      gap:10px;
    }
    .dot{
      width:10px;
      height:10px;
      border-radius:50%;
      margin-top:4px;
      background: var(--warn);
      box-shadow: 0 0 0 4px rgba(251,191,36,.12);
      flex:0 0 auto;
    }
    .check b{display:block; font-size:13px; margin-bottom:4px;}
    .check span{font-size:12px; color:var(--muted); line-height:1.4;}
    .actions{
      display:flex;
      gap:10px;
    }
    button{
      appearance:none;
      border:1px solid var(--line);
      background: var(--btn);
      color:var(--text);
      border-radius:14px;
      padding:12px 14px;
      font-weight:700;
      cursor:pointer;
      width:100%;
    }
    button.primary{
      background: linear-gradient(135deg, rgba(45,212,191,.25), rgba(27, 99, 87, .25));
      border-color: rgba(45,212,191,.35);
    }
    button.danger{
      background: linear-gradient(135deg, rgba(251,113,133,.22), rgba(122, 20, 41, .25));
      border-color: rgba(251,113,133,.35);
    }
    .side{
      padding:16px;
      display:grid;
      gap:12px;
    }
    .result{
      border-radius:16px;
      border:1px solid var(--line);
      padding:14px;
      background: rgba(255,255,255,.03);
    }
    .status{
      display:flex;
      align-items:center;
      gap:10px;
      margin-bottom:10px;
    }
    .pill{
      padding:6px 10px;
      border-radius:999px;
      font-weight:800;
      font-size:12px;
      border:1px solid var(--line);
    }
    .pill.ok{ color: var(--ok); border-color: rgba(45,212,191,.35); background: rgba(45,212,191,.10);}
    .pill.ng{ color: var(--ng); border-color: rgba(251,113,133,.35); background: rgba(251,113,133,.10);}
    ul{
      margin:8px 0 0 18px;
      padding:0;
      color:var(--muted);
      font-size:12px;
      line-height:1.55;
    }
    .footerNote{
      font-size:12px;
      color:var(--muted);
      border-top:1px solid var(--line);
      padding-top:12px;
      margin-top:6px;
    }
    @media (max-width: 880px){
      .app{ grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="app">
    <!-- 作業者用：チェック画面 -->
    <section class="card">
      <div class="header">
        <div class="title">クリーンウェア着用チェック</div>
        <div class="badge">作業者画面 / 1画面完結</div>
      </div>
      <div class="main">
        <div class="video">
          カメラ映像（プレビュー）
          <div class="hint">枠内に全身（もしくは上半身）を収めて、正面を向いてください</div>
        </div>

        <div class="grid">
          <div class="check">
            <div class="dot"></div>
            <div>
              <b>髪の毛（頭巾内）</b>
              <span>はみ出しがないかを確認</span>
            </div>
          </div>
          <div class="check">
            <div class="dot"></div>
            <div>
              <b>チャック</b>
              <span>上まで締まっているかを確認</span>
            </div>
          </div>
          <div class="check">
            <div class="dot"></div>
            <div>
              <b>ボタン</b>
              <span>留め忘れがないかを確認</span>
            </div>
          </div>
          <div class="check">
            <div class="dot"></div>
            <div>
              <b>手袋の隙間</b>
              <span>袖と手袋の境界に露出がないか</span>
            </div>
          </div>
        </div>

        <div class="actions">
          <button class="primary">チェック開始</button>
          <button>撮り直し</button>
        </div>
      </div>
    </section>

    <!-- 作業者用：結果パネル（右側） -->
    <aside class="card">
      <div class="header">
        <div class="title">判定結果</div>
        <div class="badge">表示＋警告</div>
      </div>
      <div class="side">
        <div class="result">
          <div class="status">
            <span class="pill ng">NG</span>
            <b>不備があります。修正して再チェックしてください。</b>
          </div>
          <ul>
            <li>髪の毛：頭巾の外に露出の可能性</li>
            <li>手袋：袖との間に隙間の可能性</li>
          </ul>
          <div class="footerNote">
            ※警告音を鳴らす / 点滅表示を入れる（実装でON/OFF可能）
          </div>
        </div>

        <button class="danger">警告（音）テスト</button>
        <button>管理画面へ（Step2で追加）</button>
      </div>
    </aside>
  </div>
</body>
</html>