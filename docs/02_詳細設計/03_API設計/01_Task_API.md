# 詳細設計：API 設計（Task）

## 1. 本 API の責務

本 API は、タスク（Task）の作成・参照・更新・削除および状態変更（完了／未完了）を提供する。  
スケジュール生成の入力データとして使用されるため、工数・期限・優先度などの整合性を保証する。

---

## 2. エンドポイント一覧

| 機能           | Method | Path                      |
| -------------- | ------ | ------------------------- |
| タスク一覧取得 | GET    | /tasks                    |
| タスク新規作成 | POST   | /tasks                    |
| タスク取得     | GET    | /tasks/{task_id}          |
| タスク更新     | PATCH  | /tasks/{task_id}          |
| タスク削除     | DELETE | /tasks/{task_id}          |
| タスク完了     | POST   | /tasks/{task_id}/complete |
| タスク未完了   | POST   | /tasks/{task_id}/reopen   |

---

## 3. データモデル（Task）

| 項目              | 型       | 必須 | 説明                    |
| ----------------- | -------- | ---- | ----------------------- |
| task_id           | UUID     | -    | タスク ID               |
| title             | string   | 必須 | タイトル（1〜100 文字） |
| description       | string   | 任意 | 説明（最大 2000 文字）  |
| type              | enum     | 必須 | todo / task             |
| status            | enum     | 必須 | open / done / archived  |
| priority          | int      | 必須 | 1〜5（5 が最優先）      |
| estimate_minutes  | int      | 必須 | 想定工数（分）          |
| due_at            | datetime | 任意 | 締切                    |
| available_from    | datetime | 任意 | 開始可能日時            |
| available_to      | datetime | 任意 | 終了制限日時            |
| splittable        | bool     | 任意 | 分割可否（既定 true）   |
| min_block_minutes | int      | 任意 | 最小ブロック（分）      |
| tags              | string[] | 任意 | タグ                    |
| created_at        | datetime | -    | 作成日時                |
| updated_at        | datetime | -    | 更新日時                |

---

## 4. GET /tasks（一覧取得）

### 4.1 Request

#### Query Parameters（任意）

| 名称   | 型     | 説明                   |
| ------ | ------ | ---------------------- |
| status | string | open / done / archived |
| q      | string | title 部分一致         |

### 4.2 Response（200）

```json
{
  "data": [
    {
      "task_id": "uuid",
      "title": "設計書作成",
      "description": "API設計を行う",
      "type": "task",
      "status": "open",
      "priority": 5,
      "estimate_minutes": 120,
      "due_at": "2026-01-12T23:59:00+09:00",
      "available_from": null,
      "available_to": null,
      "splittable": true,
      "min_block_minutes": 30,
      "tags": ["design"],
      "created_at": "2026-01-10T10:00:00+09:00",
      "updated_at": "2026-01-10T10:00:00+09:00"
    }
  ],
  "meta": {}
}
```

### 4.3 Error

- 500：E-0500

---

## 5. POST /tasks（新規作成）

### 5.1 Request Body

```json
{
  "title": "設計書作成",
  "description": "API 設計を行う",
  "type": "task",
  "priority": 5,
  "estimate_minutes": 120,
  "due_at": "2026-01-12T23:59:00+09:00",
  "available_from": null,
  "available_to": null,
  "splittable": true,
  "min_block_minutes": 30,
  "tags": ["design"]
}
```

### 5.2 Validation

- title：必須、1〜100 文字
- type：必須、todo / task
- priority：必須、1〜5
- estimate_minutes：必須、5〜1440
- due_at：任意、datetime
- available_from / available_to：両方ある場合 available_from < available_to
- min_block_minutes：splittable=true の場合のみ、5〜180

### 5.3 Response（201）

```json
{
  "data": {
    "task_id": "uuid"
  },
  "meta": {
    "message_id": "I-0001"
  }
}
```

### 5.4 Error

- 400：E-0400（field_errors）
- 500：E-0500

---

## 6. GET /tasks/{task_id}（取得）

### 6.1 Response（200）

```json
{
  "data": {
    "task_id": "uuid",
    "title": "設計書作成",
    "description": "API設計を行う",
    "type": "task",
    "status": "open",
    "priority": 5,
    "estimate_minutes": 120,
    "due_at": null,
    "available_from": null,
    "available_to": null,
    "splittable": true,
    "min_block_minutes": 30,
    "tags": ["design"],
    "created_at": "2026-01-10T10:00:00+09:00",
    "updated_at": "2026-01-10T10:00:00+09:00"
  },
  "meta": {}
}
```

### 6.2 Error

- 404：E-0404
- 500：E-0500

---

## 7. PATCH /tasks/{task_id}（更新）

### 7.1 Request Body（部分更新）

```json
{
  "title": "設計書更新",
  "priority": 4,
  "estimate_minutes": 90,
  "status": "open"
}
```

### 7.2 Validation

- POST /tasks と同等
- status：open / done / archived
- status=archived は計画生成対象外

### 7.3 Response（200）

```json
{
  "data": {
    "task_id": "uuid"
  },
  "meta": {
    "message_id": "I-0002"
  }
}
```

### 7.4 Error

- 400：E-0400
- 404：E-0404
- 500：E-0500

---

## 8. DELETE /tasks/{task_id}（削除）

### 8.1 Response（200）

```json
{
  "data": {
    "task_id": "uuid"
  },
  "meta": {
    "message_id": "I-0003"
  }
}
```

### 8.2 Error

- 404：E-0404
- 500：E-0500

---

## 9. POST /tasks/{task_id}/complete（完了）

### 9.1 Response（200）

```json
{
  "data": {
    "task_id": "uuid",
    "status": "done"
  },
  "meta": {
    "message_id": "I-0004"
  }
}
```

---

## 10. POST /tasks/{task_id}/reopen（未完了）

### 10.1 Response（200）

```json
{
  "data": {
    "task_id": "uuid",
    "status": "open"
  },
  "meta": {
    "message_id": "I-0005"
  }
}
```

---

## 11. 実装準拠事項

- 本仕様に定義のない項目・挙動は実装しない
- レスポンス形式・エラーフォーマットは API 共通仕様に準拠する
- Task の状態遷移は本 API のみで行う
