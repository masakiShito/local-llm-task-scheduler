# 詳細設計：API 設計（Plan / PlanBlock）

## 1. 本 API の責務

本 API は、計画（Plan）および計画ブロック（PlanBlock）の参照・削除を提供する。  
計画の生成は POST /plans/generate により行い、本 API では生成処理を行わない。

---

## 2. エンドポイント一覧

| 機能             | Method | Path                    |
| ---------------- | ------ | ----------------------- |
| 計画一覧取得     | GET    | /plans                  |
| 計画取得         | GET    | /plans/{plan_id}        |
| 計画ブロック取得 | GET    | /plans/{plan_id}/blocks |
| 計画削除         | DELETE | /plans/{plan_id}        |

---

## 3. データモデル

### 3.1 Plan

| 項目       | 型       | 必須 | 説明                                    |
| ---------- | -------- | ---- | --------------------------------------- |
| plan_id    | UUID     | -    | 計画 ID                                 |
| date       | date     | 必須 | 対象日（YYYY-MM-DD）                    |
| timezone   | string   | 必須 | タイムゾーン                            |
| params     | object   | 必須 | 生成条件（working_hours / constraints） |
| summary    | object   | 任意 | LLM 生成の説明                          |
| created_at | datetime | -    | 作成日時                                |
| updated_at | datetime | -    | 更新日時                                |

### 3.2 PlanBlock

| 項目       | 型       | 必須 | 説明                   |
| ---------- | -------- | ---- | ---------------------- |
| block_id   | UUID     | -    | ブロック ID            |
| plan_id    | UUID     | -    | 計画 ID                |
| start_at   | datetime | 必須 | 開始日時               |
| end_at     | datetime | 必須 | 終了日時               |
| kind       | enum     | 必須 | work / break / buffer  |
| task_id    | UUID     | 任意 | work 時のみ設定        |
| task_title | string   | 任意 | 表示用（MVP では同梱） |
| meta       | object   | 任意 | 割当理由・スコア等     |

---

## 4. GET /plans（計画一覧取得）

### 4.1 Request

#### Query Parameters（任意）

| 名称      | 型   | 説明   |
| --------- | ---- | ------ |
| date_from | date | 開始日 |
| date_to   | date | 終了日 |

### 4.2 Response（200）

```json
{
  "data": [
    {
      "plan_id": "uuid",
      "date": "2026-01-11",
      "timezone": "Asia/Tokyo",
      "created_at": "2026-01-11T12:00:00+09:00",
      "updated_at": "2026-01-11T12:00:00+09:00"
    }
  ],
  "meta": {}
}
```

### 4.3 Validation

- date_from / date_to：YYYY-MM-DD
- date_from <= date_to

### 4.4 Error

- 400：E-0400
- 500：E-0500

---

## 5. GET /plans/{plan_id}（計画取得）

### 5.1 Response（200）

```json
{
  "data": {
    "plan_id": "uuid",
    "date": "2026-01-11",
    "timezone": "Asia/Tokyo",
    "params": {
      "working_hours": [
        {
          "start": "09:00",
          "end": "12:00"
        },
        {
          "start": "13:00",
          "end": "18:00"
        }
      ],
      "constraints": {
        "break_minutes": 10,
        "focus_max_minutes": 90,
        "buffer_ratio": 0.1
      }
    },
    "summary": null,
    "created_at": "2026-01-11T12:00:00+09:00",
    "updated_at": "2026-01-11T12:00:00+09:00"
  },
  "meta": {}
}
```

### 5.2 Error

- 404：E-0404
- 500：E-0500

---

## 6. GET /plans/{plan_id}/blocks（計画ブロック取得）

### 6.1 Response（200）

```json
{
  "data": [
    {
      "block_id": "uuid",
      "plan_id": "uuid",
      "start_at": "2026-01-11T09:00:00+09:00",
      "end_at": "2026-01-11T10:30:00+09:00",
      "kind": "work",
      "task_id": "uuid",
      "task_title": "設計書作成",
      "meta": {}
    },
    {
      "block_id": "uuid",
      "plan_id": "uuid",
      "start_at": "2026-01-11T10:30:00+09:00",
      "end_at": "2026-01-11T10:40:00+09:00",
      "kind": "break",
      "task_id": null,
      "task_title": null,
      "meta": {}
    }
  ],
  "meta": {}
}
```

### 6.2 Error

- 404：E-0404
- 500：E-0500

---

## 7. DELETE /plans/{plan_id}（計画削除）

### 7.1 Response（200）

```json
{
  "data": {
    "plan_id": "uuid"
  },
  "meta": {
    "message_id": "I-0202"
  }
}
```

### 7.2 Error

- 404：E-0404
- 500：E-0500

---

## 8. 仕様補足

- Plan は生成後に更新されない（immutable 運用）
- PlanBlock は Plan に紐づき、単独での CRUD は提供しない
- 表示用の task_title は MVP ではブロック取得 API で同梱する

---

## 9. 実装準拠事項

- 本 API は参照・削除専用とする
- 計画生成ロジックは本 API に含めない
- エラーフォーマット・message_id は API 共通仕様に準拠する
