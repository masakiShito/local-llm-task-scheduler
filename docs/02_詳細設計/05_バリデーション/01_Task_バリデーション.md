# 詳細設計：Task バリデーション（MVP）

## 1. 対象 API

- POST /tasks
- PATCH /tasks/{task_id}

---

## 2. 項目別バリデーション

| 項目              | 必須     | バリデーション内容           |
| ----------------- | -------- | ---------------------------- |
| title             | 必須     | 1〜100 文字                  |
| description       | 任意     | 0〜2000 文字                 |
| type              | 必須     | todo / task                  |
| priority          | 必須     | 1〜5                         |
| estimate_minutes  | 必須     | 5〜1440                      |
| due_at            | 任意     | datetime（ISO8601, TZ 付き） |
| available_from    | 任意     | datetime                     |
| available_to      | 任意     | datetime                     |
| splittable        | 任意     | boolean                      |
| min_block_minutes | 条件付き | 5〜180                       |
| tags              | 任意     | 配列、各要素 1〜30 文字      |

---

## 3. 整合性バリデーション

- available_from と available_to の両方が存在する場合
  - available_from < available_to
- splittable=false の場合
  - min_block_minutes は null または未指定のみ許可
- splittable=true の場合
  - min_block_minutes は必須、かつ 5〜180
- status=archived
  - 計画生成対象外（エラーにはしない）

---

## 4. エラー例（field_errors）

    field: title
    message_id: E-0400
    message: タイトルは必須です

    field: estimate_minutes
    message_id: E-0400
    message: 5以上1440以下で入力してください
