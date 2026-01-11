# 詳細設計：API 設計（Event）

## 1. 本 API の責務

本 API は、固定予定（Event）の作成・参照・更新・削除を提供する。  
固定予定はスケジュール生成において「作業不可時間」として扱われる。

MVP では以下を前提とする。

- 単一ユーザー
- 外部カレンダー連携なし
- 固定予定は常に locked = true として扱う

---

## 2. エンドポイント一覧

| 機能                       | Method | Path               |
| -------------------------- | ------ | ------------------ |
| 固定予定一覧取得（対象日） | GET    | /events            |
| 固定予定新規作成           | POST   | /events            |
| 固定予定取得               | GET    | /events/{event_id} |
| 固定予定更新               | PATCH  | /events/{event_id} |
| 固定予定削除               | DELETE | /events/{event_id} |

---

## 3. データモデル（Event）

| 項目        | 型       | 必須 | 説明                              |
| ----------- | -------- | ---- | --------------------------------- |
| event_id    | UUID     | -    | 固定予定 ID                       |
| title       | string   | 必須 | タイトル（1〜100 文字）           |
| start_at    | datetime | 必須 | 開始日時（ISO8601, TZ 付き）      |
| end_at      | datetime | 必須 | 終了日時（ISO8601, TZ 付き）      |
| locked      | bool     | -    | ロックフラグ（MVP では常に true） |
| description | string   | 任意 | メモ（最大 2000 文字）            |
| created_at  | datetime | -    | 作成日時                          |
| updated_at  | datetime | -    | 更新日時                          |

---

## 4. GET /events（固定予定一覧取得）

### 4.1 Request

#### Query Parameters（必須）

| 名称 | 型   | 説明                 |
| ---- | ---- | -------------------- |
| date | date | 対象日（YYYY-MM-DD） |

### 4.2 Response（200）

```json
{
  "data": [
    {
      "event_id": "uuid",
      "title": "会議",
      "start_at": "2026-01-11T10:00:00+09:00",
      "end_at": "2026-01-11T11:00:00+09:00",
      "locked": true,
      "description": "定例MTG",
      "created_at": "2026-01-10T12:00:00+09:00",
      "updated_at": "2026-01-10T12:00:00+09:00"
    }
  ],
  "meta": {}
}
```

### 4.3 Validation

- date：必須
- date：YYYY-MM-DD 形式

### 4.4 Error

- 400：E-0400（date 不正）
- 500：E-0500

---

## 5. POST /events（固定予定新規作成）

### 5.1 Request Body

```json
{
  "title": "会議",
  "start_at": "2026-01-11T10:00:00+09:00",
  "end_at": "2026-01-11T11:00:00+09:00",
  "description": "定例MTG"
}
```

### 5.2 Validation

- title：必須、1〜100 文字
- start_at：必須、datetime
- end_at：必須、datetime
- start_at < end_at
- description：任意、0〜2000 文字

### 5.3 Response（201）

```json
{
  "data": {
    "event_id": "uuid"
  },
  "meta": {
    "message_id": "I-0101"
  }
}
```

### 5.4 Error

- 400：E-0400（field_errors）
- 500：E-0500

---

## 6. GET /events/{event_id}（固定予定取得）

### 6.1 Response（200）

```json
{
  "data": {
    "event_id": "uuid",
    "title": "会議",
    "start_at": "2026-01-11T10:00:00+09:00",
    "end_at": "2026-01-11T11:00:00+09:00",
    "locked": true,
    "description": "定例MTG",
    "created_at": "2026-01-10T12:00:00+09:00",
    "updated_at": "2026-01-10T12:00:00+09:00"
  },
  "meta": {}
}
```

### 6.2 Error

- 404：E-0404
- 500：E-0500

---

## 7. PATCH /events/{event_id}（固定予定更新）

### 7.1 Request Body（部分更新）

```json
{
  "title": "会議（変更後）",
  "start_at": "2026-01-11T10:30:00+09:00",
  "end_at": "2026-01-11T11:30:00+09:00",
  "description": "時間変更"
}
```

### 7.2 Validation

- POST /events と同等
- locked は更新不可（Request で受け取らない）

### 7.3 Response（200）

```json
{
  "data": {
    "event_id": "uuid"
  },
  "meta": {
    "message_id": "I-0102"
  }
}
```

### 7.4 Error

- 400：E-0400
- 404：E-0404
- 500：E-0500

---

## 8. DELETE /events/{event_id}（固定予定削除）

### 8.1 Response（200）

```json
{
  "data": {
    "event_id": "uuid"
  },
  "meta": {
    "message_id": "I-0103"
  }
}
```

### 8.2 Error

- 404：E-0404
- 500：E-0500

---

## 9. 実装準拠事項

- 固定予定は常に locked = true として保存する
- スケジュール生成時、固定予定は作業不可時間として必ず除外する
- 本仕様に定義のない挙動は実装しない
