# 詳細設計：API 共通仕様（MVP)

## 1. 本書の目的

本書は、本システムの API における共通ルール（HTTP/JSON、日時表現、レスポンス形式、エラーフォーマット）を定義し、
フロントエンド実装・バックエンド実装・テスト実装の基準を統一することを目的とする。

---

## 2. 対象範囲

- 対象：MVP で提供する全 API
- 対象外：外部サービス連携（Google Calendar 等）

---

## 3. 共通ルール（HTTP / JSON）

### 3.1 HTTP

- 文字コード：UTF-8
- Content-Type：application/json
- リクエストボディ：JSON
- レスポンスボディ：JSON

### 3.2 JSON

- JSON のキー命名：snake_case
- null の扱い：値が存在しない場合に使用する
- 配列：順序に意味がある場合は順序を保証する

---

## 4. 日時・タイムゾーンの扱い

### 4.1 基本方針

- API で扱う日時は ISO 8601 形式の文字列とする
- タイムゾーンは必ずオフセット付きで扱う
- MVP の既定タイムゾーンは Asia/Tokyo とする

### 4.2 形式

- datetime：`YYYY-MM-DDTHH:mm:ss+09:00`
- date：`YYYY-MM-DD`
- time（時刻のみ）：`HH:mm`

### 4.3 DB 保存

- datetime はタイムゾーン付きのまま保存する
- date / time は用途に応じて型を分けて保存する

---

## 5. 共通レスポンス形式

### 5.1 成功レスポンス（200 / 201）

- 成功時は `data` を返却する
- 付帯情報が必要な場合は `meta` を返却する

```json
{
  "data": {},
  "meta": {}
}
```

### 5.2 一覧レスポンス（200）

- 一覧取得は data を配列とする
- ページングを使用する場合は meta.pagination を返却する

```json
{
  "data": [],
  "meta": {
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 0
    }
  }
}
```

---

## 6. エラーフォーマット（必須）

### 6.1 エラー共通形式（4xx / 5xx）

- エラー時は error を返却する
- message_id は必須とする
- message は UI 表示の既定文言として返却する
- 入力項目単位のエラーがある場合は field_errors を返却する

```json
{
  "error": {
    "message_id": "E-0400",
    "message": "入力内容を確認してください",
    "field_errors": [
      {
        "field": "estimate_minutes",
        "message_id": "E-0400",
        "message": "5以上60以下で入力してください"
      }
    ]
  }
}
```

### 6.2 field_errors 仕様

- field はリクエストの JSON キー名を指定する
- ネストされた構造はドット表記とする

例：

- working_hours.0.start
- working_hours.1.end

---

## 7. ステータスコード運用

### 7.1 200 OK

- 取得成功
- 更新成功
- 計画生成成功（overflow / warnings があっても成功扱い）

### 7.2 201 Created

- 作成成功（POST）

### 7.3 204 No Content

- 使用しない（MVP では成功時に必ず JSON を返却する）

### 7.4 400 Bad Request

- 入力値不正
- バリデーションエラー（必須不足、型不正、範囲不正、整合性不正）

### 7.5 404 Not Found

- 指定 ID が存在しない

### 7.6 500 Internal Server Error

- サーバ内部障害
- DB 接続不可
- 予期しない例外

---

## 8. message_id 運用

### 8.1 命名規則

- Info：I-XXXX
- Warning：W-XXXX
- Error：E-XXXX

### 8.2 運用方針

- API は message_id を返却し、UI は message_id に基づいて文言を決定する
- API の message は既定値として返却する
- UI 側で message_id に対応する文言定義がある場合は、UI 定義を優先する

---

## 9. API 共通の識別子

- ID は UUID 形式の文字列とする
- フィールド名は task_id / event_id / plan_id の形式とする

---

## 10. 例外事項（計画生成）

- POST /plans/generate は overflow / warnings / LLM 失敗を含んでも 200 で返却する
- LLM 失敗は error として返却せず、warnings として扱う
