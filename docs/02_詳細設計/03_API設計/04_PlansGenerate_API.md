# 詳細設計：API 設計（POST /plans/generate）

## 1. 本 API の責務

本 API は、対象日の作業可能時間に対して未完了タスクを割り当てた計画（Plan / PlanBlock）を生成し、保存して返却する。  
生成結果は「提案」であり、ユーザーが最終的に採用する前提で返却する。

本 API は以下を満たす。

- 入力バリデーション（形式・範囲・整合性）
- 対象タスク取得（open のみ）
- 対象日の固定予定取得
- スケジューラ実行（blocks / overflow / warnings）
- Plan/PlanBlock の保存
- 可能であれば説明（summary）を生成し保存する（失敗しても計画生成は成功）

---

## 2. Method / Path

- Method：POST
- Path：/plans/generate

---

## 3. Request

### 3.1 Request Body

    date: 2026-01-11
    timezone: Asia/Tokyo
    working_hours:
      - start: "09:00"
        end: "12:00"
      - start: "13:00"
        end: "18:00"
    constraints:
      break_minutes: 10
      focus_max_minutes: 90
      buffer_ratio: 0.1

### 3.2 フィールド定義

| 項目           | キー                          | 型     | 必須 | 説明                |
| -------------- | ----------------------------- | ------ | ---- | ------------------- |
| 対象日         | date                          | date   | 必須 | YYYY-MM-DD          |
| タイムゾーン   | timezone                      | string | 必須 | MVP 既定 Asia/Tokyo |
| 作業可能時間   | working_hours                 | array  | 必須 | 1〜3 件             |
| 作業開始       | working_hours[].start         | time   | 必須 | HH:mm               |
| 作業終了       | working_hours[].end           | time   | 必須 | HH:mm               |
| 休憩（分）     | constraints.break_minutes     | int    | 任意 | 既定 10             |
| 集中上限（分） | constraints.focus_max_minutes | int    | 任意 | 既定 90             |
| バッファ比率   | constraints.buffer_ratio      | number | 任意 | 既定 0.10           |

### 3.3 バリデーション（形式・範囲）

- date：必須、YYYY-MM-DD
- timezone：必須（MVP では Asia/Tokyo を許可値として扱う）
- working_hours：必須、1〜3 件
- working_hours[].start / end：必須、HH:mm
- constraints.break_minutes：0〜30（既定 10）
- constraints.focus_max_minutes：30〜180（既定 90）
- constraints.buffer_ratio：0.00〜0.30（既定 0.10）

### 3.4 バリデーション（整合性）

- working_hours[].start < working_hours[].end
- working_hours の時間帯は重複・交差不可
- working_hours は start 昇順に正規化して扱う（内部処理）
- constraints.buffer_ratio は小数 2 桁までを許容する（内部処理では 0.00〜0.30 に丸めない）
- 計画生成対象タスクは status=open のみ

### 3.5 field_errors.field の命名（例）

- date
- timezone
- working_hours
- working_hours.0.start
- working_hours.0.end
- constraints.break_minutes
- constraints.focus_max_minutes
- constraints.buffer_ratio

---

## 4. 処理フロー（要点）

1. 入力バリデーション（形式・範囲・整合性）
2. 対象タスク取得（status=open、archived 除外）
3. 対象日の固定予定取得（date で抽出）
4. 作業可能時間から固定予定を差し引き、空き時間スロットを生成
5. スケジューラ実行
   - blocks（work/break/buffer）
   - overflow（本日に収まらないタスク）
   - warnings（注意事項）
6. Plan 作成・PlanBlock 作成（トランザクション）
7. 説明生成（summary）
   - 生成に失敗しても計画は成功として扱う
   - summary は null とし、warnings に追加する
8. Plan を更新（summary 保存）

---

## 5. Response（200）

### 5.1 Response Body

    data:
      plan:
        plan_id: uuid
        date: 2026-01-11
        timezone: Asia/Tokyo
        params:
          working_hours:
            - start: "09:00"
              end: "12:00"
            - start: "13:00"
              end: "18:00"
          constraints:
            break_minutes: 10
            focus_max_minutes: 90
            buffer_ratio: 0.1
        summary: null

      blocks:
        - block_id: uuid
          start_at: 2026-01-11T09:00:00+09:00
          end_at: 2026-01-11T10:30:00+09:00
          kind: work
          task_id: uuid
          task_title: 設計書作成
          meta: {}
        - block_id: uuid
          start_at: 2026-01-11T10:30:00+09:00
          end_at: 2026-01-11T10:40:00+09:00
          kind: break
          task_id: null
          task_title: null
          meta: {}

      overflow:
        - task_id: uuid
          task_title: 実装
          estimate_minutes: 120
          priority: 4
          due_at: 2026-01-12T12:00:00+09:00
          reason: not_enough_free_time

      warnings:
        - message_id: W-0201
          message: 本日の空き時間に収まらないタスクがあります

    meta:
      message_id: I-0201

---

## 6. ステータスコード運用

- 200：生成成功（overflow / warnings が存在しても成功扱い）
- 201：使用しない（生成結果は常に 200）
- 400：入力エラー（field_errors）
- 500：サーバ内部エラー

---

## 7. Error

### 7.1 400 Bad Request（バリデーション）

    error:
      message_id: E-0400
      message: 入力内容を確認してください
      field_errors:
        - field: working_hours.0.start
          message_id: E-0400
          message: 開始時刻を確認してください

### 7.2 500 Internal Server Error

    error:
      message_id: E-0500
      message: サーバでエラーが発生しました
      field_errors: []

---

## 8. warnings / overflow の仕様

### 8.1 warnings

- warnings は計画生成の成功（200）に同梱される注意情報
- warnings.message*id は「06*エラー仕様/01_message_id 一覧.md」に定義する

### 8.2 overflow

- overflow は本日に収まらないタスク一覧
- reason は reason コードとして返却する（文言は UI 側で制御可能）

---

## 9. LLM（summary）生成の扱い

- summary は Plan に保存し、GET /plans/{plan_id} で取得できる
- LLM 生成に失敗した場合
  - summary は null
  - warnings に以下を追加する
    - message_id: W-0203
    - message: 説明の生成に失敗しました

---

## 10. 実装準拠事項

- 本 API は「計画生成＋保存＋返却」を必ず同一リクエストで完結させる
- overflow / warnings は成功レスポンスに含め、エラーとして返却しない
- スケジューラは決定論的に動作する（同一入力で同一結果を返す）
- エラーフォーマットおよび field_errors は API 共通仕様に準拠する
