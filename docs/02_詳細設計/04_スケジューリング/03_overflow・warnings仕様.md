# 詳細設計：overflow・warnings 仕様（MVP）

## 1. overflow 仕様

### 1.1 overflow 要素

| 項目             | 型       | 必須 | 説明                |
| ---------------- | -------- | ---- | ------------------- |
| task_id          | UUID     | 必須 | タスク ID           |
| task_title       | string   | 必須 | タスクタイトル      |
| estimate_minutes | int      | 必須 | 想定工数            |
| priority         | int      | 必須 | 優先度              |
| due_at           | datetime | 任意 | 締切                |
| reason           | string   | 必須 | overflow 理由コード |

### 1.2 overflow reason コード一覧

- not_enough_free_time：総空き時間が不足
- not_enough_continuous_time：分割不可で連続枠が不足
- out_of_availability_window：開始/終了制限により対象日で実行不可
- remaining_too_small：分割後の残りが最小ブロック未満

---

## 2. warnings 仕様

### 2.1 warnings 要素

| 項目       | 型     | 必須 | 説明         |
| ---------- | ------ | ---- | ------------ |
| message_id | string | 必須 | W-xxxx       |
| message    | string | 必須 | 既定表示文言 |

### 2.2 warnings の付与条件（MVP）

- W-0201：overflow が存在する
- W-0202：期限が当日以内のタスクが overflow に存在する
- W-0210：休憩を確保できない（break 挿入ができない）
- W-0211：バッファを確保できない
- W-0203：LLM 説明生成に失敗した（summary=null）

---

## 3. UI 表示方針

- warnings は注意として表示する（エラー表示はしない）
- overflow は「今日入らなかったタスク」として表示する
- reason の文言は UI 側で message_id 相当の表示に変換してよい

---

## 4. 実装準拠事項

- overflow / warnings は 200 レスポンスに同梱する
- overflow / warnings の有無で HTTP ステータスを変えない
- reason / message_id は固定値として扱い、意味の変更は設計変更とする
