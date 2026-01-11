【ファイル名】docs/詳細設計/05*バリデーション/02_Event*バリデーション.md

# 詳細設計：Event バリデーション（MVP）

## 1. 対象 API

- POST /events
- PATCH /events/{event_id}

---

## 2. 項目別バリデーション

| 項目        | 必須 | バリデーション内容           |
| ----------- | ---- | ---------------------------- |
| title       | 必須 | 1〜100 文字                  |
| start_at    | 必須 | datetime（ISO8601, TZ 付き） |
| end_at      | 必須 | datetime（ISO8601, TZ 付き） |
| description | 任意 | 0〜2000 文字                 |

---

## 3. 整合性バリデーション

- start_at < end_at
- start_at と end_at は同一タイムゾーンとして比較する
- locked は常に true（入力で受け取らない）

---

## 4. ドメインルール

- 固定予定は作業不可時間として必ず扱われる
- 日付を跨ぐ固定予定は許可する（生成時に対象日部分のみ使用）

---

## 5. エラー例

    field: start_at
    message_id: E-0400
    message: 開始日時を確認してください

    field: end_at
    message_id: E-0400
    message: 終了日時を確認してください
