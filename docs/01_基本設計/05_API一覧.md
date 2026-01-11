# 基本設計書：API 一覧（MVP）

## 1. 本書の目的

本書は、MVP で提供する API を一覧化し、機能の網羅性と責務を明確にすることを目的とする。
本一覧は、詳細設計（API 設計）および実装（FastAPI）における前提資料とする。

---

## 2. 前提・方針

### 2.1 API 設計方針（MVP）

- まずはシンプルな REST で構成する
- 入出力は JSON
- バリデーションエラーは 400、存在しない ID は 404、権限は MVP で扱わない（単一ユーザー）
- 生成 API は `POST /plans/generate` の単一エンドポイントで提供する

### 2.2 タイムゾーン

- すべて `Asia/Tokyo` を前提とする（MVP）
- datetime は ISO 8601（例：`2026-01-10T09:00:00+09:00`）

---

## 3. API 一覧（エンドポイント一覧）

## 3.1 Task API（タスク管理）

|   No | メソッド | パス                      | 機能           | 概要                       | 主なレスポンス |
| ---: | -------- | ------------------------- | -------------- | -------------------------- | -------------- |
| T-01 | GET      | /tasks                    | タスク一覧取得 | 検索・フィルタ・並び替え用 | Task[]         |
| T-02 | POST     | /tasks                    | タスク作成     | 新規登録                   | Task           |
| T-03 | GET      | /tasks/{task_id}          | タスク詳細取得 | 1 件取得                   | Task           |
| T-04 | PATCH    | /tasks/{task_id}          | タスク更新     | 部分更新                   | Task           |
| T-05 | DELETE   | /tasks/{task_id}          | タスク削除     | 物理削除（MVP）            | 204            |
| T-06 | POST     | /tasks/{task_id}/complete | タスク完了     | status=done へ更新         | Task           |
| T-07 | POST     | /tasks/{task_id}/reopen   | タスク再開     | status=open へ更新         | Task           |

### 推奨クエリ（例）

- `status=open|done|archived`
- `type=todo|task`
- `q=keyword`（title/description 検索）
- `due_before=...` / `due_after=...`（任意）
- `sort=due_at|priority|updated_at`（任意）

---

## 3.2 Event API（固定予定管理）

|   No | メソッド | パス               | 機能             | 概要               | 主なレスポンス |
| ---: | -------- | ------------------ | ---------------- | ------------------ | -------------- |
| E-01 | GET      | /events            | 固定予定一覧取得 | 対象日や期間で取得 | Event[]        |
| E-02 | POST     | /events            | 固定予定作成     | 新規登録           | Event          |
| E-03 | GET      | /events/{event_id} | 固定予定詳細取得 | 1 件取得           | Event          |
| E-04 | PATCH    | /events/{event_id} | 固定予定更新     | 部分更新           | Event          |
| E-05 | DELETE   | /events/{event_id} | 固定予定削除     | 物理削除（MVP）    | 204            |

### 推奨クエリ（例）

- `date=YYYY-MM-DD`（対象日）
- `from=YYYY-MM-DD` / `to=YYYY-MM-DD`（期間）
- `q=keyword`（title 検索、任意）

---

## 3.3 Plan API（計画・生成）

|   No | メソッド | パス                    | 機能             | 概要                          | 主なレスポンス                                 |
| ---: | -------- | ----------------------- | ---------------- | ----------------------------- | ---------------------------------------------- |
| P-01 | POST     | /plans/generate         | 計画生成         | 指定日の計画を生成し保存      | Plan + blocks + overflow + warnings + summary? |
| P-02 | GET      | /plans                  | 計画一覧取得     | 日付や期間で Plan 一覧を取得  | Plan[]                                         |
| P-03 | GET      | /plans/{plan_id}        | 計画詳細取得     | Plan 本体取得（summary 含む） | Plan                                           |
| P-04 | GET      | /plans/{plan_id}/blocks | 計画ブロック取得 | PlanBlocks 取得               | PlanBlock[]                                    |
| P-05 | DELETE   | /plans/{plan_id}        | 計画削除         | 物理削除（MVP）               | 204                                            |

### 推奨クエリ（例）

- `date=YYYY-MM-DD`（対象日）
- `from=YYYY-MM-DD` / `to=YYYY-MM-DD`（期間）
- `latest=true`（直近 Plan、任意）

---

## 3.4 Health / Meta（任意）

|   No | メソッド | パス    | 機能           | 概要     | 主なレスポンス     |
| ---: | -------- | ------- | -------------- | -------- | ------------------ |
| H-01 | GET      | /health | ヘルスチェック | 稼働確認 | { "status": "ok" } |

---

## 4. 画面と API の対応（トレーサビリティ）

| 画面 ID | 画面名                   | 主に使用する API                   |
| ------- | ------------------------ | ---------------------------------- |
| SCR-200 | タスク一覧               | T-01, T-02, T-04, T-05, T-06, T-07 |
| SCR-201 | タスク詳細               | T-03, T-04, T-06, T-07             |
| SCR-202 | タスク作成               | T-02                               |
| SCR-203 | タスク編集               | T-03, T-04, T-05                   |
| SCR-300 | 固定予定一覧             | E-01, E-02, E-04, E-05             |
| SCR-301 | 固定予定詳細             | E-03, E-04, E-05                   |
| SCR-302 | 固定予定作成             | E-02                               |
| SCR-303 | 固定予定編集             | E-03, E-04, E-05                   |
| SCR-400 | 計画一覧                 | P-02                               |
| SCR-401 | 計画生成（条件入力）     | P-01, （参照）T-01, E-01           |
| SCR-402 | 計画詳細（タイムライン） | P-03, P-04                         |
| SCR-403 | overflow / warnings 詳細 | P-03, P-04                         |

---

## 5. MVP の割り切り（API）

- 認証・認可は MVP 対象外（単一ユーザー前提）
- Plan のロック・再生成 API は Phase1.5 以降
  - 例：`POST /plans/{plan_id}/lock-block`
  - 例：`POST /plans/{plan_id}/regenerate`
- Event/Task の繰り返し、依存関係、週最適化 API は Phase2 以降

---

## 6. 次工程への引き渡し

- 詳細設計（API 設計）で、各 API の
  - リクエスト/レスポンススキーマ
  - バリデーション
  - エラー仕様
    を確定する
- スケジューリング仕様（詳細設計）に基づき、`POST /plans/generate` の入出力を固める
