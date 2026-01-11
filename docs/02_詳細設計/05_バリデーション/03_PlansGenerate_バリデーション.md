# 詳細設計：PlansGenerate バリデーション（MVP）

## 1. 対象 API

- POST /plans/generate

---

## 2. 項目別バリデーション

| 項目                          | 必須 | バリデーション内容  |
| ----------------------------- | ---- | ------------------- |
| date                          | 必須 | YYYY-MM-DD          |
| timezone                      | 必須 | MVP では Asia/Tokyo |
| working_hours                 | 必須 | 配列、1〜3 件       |
| working_hours[].start         | 必須 | HH:mm               |
| working_hours[].end           | 必須 | HH:mm               |
| constraints.break_minutes     | 任意 | 0〜30               |
| constraints.focus_max_minutes | 任意 | 30〜180             |
| constraints.buffer_ratio      | 任意 | 0.00〜0.30          |

---

## 3. 整合性バリデーション

### 3.1 working_hours

- start < end
- 時間帯の重複・交差は禁止
- 昇順に並んでいなくても受理し、内部で正規化する

### 3.2 制約パラメータ

- break_minutes < focus_max_minutes
- buffer_ratio は小数 2 桁まで許可

### 3.3 タスク存在チェック

- status=open のタスクが 0 件でもエラーにはしない
- 生成結果は blocks=[]、overflow=[] とする

---

## 4. ドメインルール

- 作業可能時間が存在しない場合はエラー
- 固定予定により空き時間が 0 になる場合
  - エラーにはしない
  - overflow + warnings を返却する

---

## 5. エラー例

    field: working_hours
    message_id: E-0400
    message: 作業可能時間を入力してください

    field: working_hours.1.start
    message_id: E-0400
    message: 時刻の形式が正しくありません
