# インフラストラクチャ単体テスト実行ガイド

## 対象
- `infra/tests/unit/test_infra_stack.py`
- 既存テスト: `infra/tests/test_*.py`
- テストケース対応: `INF-RES-*`, `INF-STK-*`

## 前提条件
- Python 3.12+
- pipenv
- AWS CDK v2

## セットアップ（pipenv）
```bash
cd /Users/matsuiminato/Desktop/cleanboss/infra
pipenv --python 3.12
pipenv install aws-cdk-lib==2.179.0 constructs pytest
```

## 実行方法
```bash
# unitテストのみ
pipenv run pytest -q tests/unit

# infra配下の全テスト
pipenv run pytest -q tests

# 詳細表示
pipenv run pytest -v tests/unit/test_infra_stack.py
```

## 補足
- CDK assertions ベースのテンプレートテストです。
- AWS資格情報は `pytest` 実行には不要（`cdk deploy` は別途必要）。
