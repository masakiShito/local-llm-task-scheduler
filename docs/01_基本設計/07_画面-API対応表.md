# 詳細設計書：画面-API 対応表（MVP）

## 1. 本書の目的

- 各画面が使用する API を明確にする
- 画面実装と API 実装の責務を分離する
- CRUD 図・API 一覧とのトレーサビリティを確保する

---

## 2. 設計方針

- 本書に記載のない API は当該画面から使用しない
- API の I/O・エラー仕様は個別 API 設計に従う
- 画面は API の内部実装を意識しない

---

## 3. 画面別：使用 API 一覧（MVP）

### ホーム / ダッシュボード（SCR-100）

#### 使用 API

- GET /tasks
- GET /plans

#### 非使用 API

- 上記以外の全 API

---

### タスク一覧（SCR-200）

#### 使用 API

- GET /tasks
- POST /tasks
- PATCH /tasks/{task_id}
- DELETE /tasks/{task_id}
- POST /tasks/{task_id}/complete
- POST /tasks/{task_id}/reopen

#### 非使用 API

- 上記以外の全 API

---

### タスク詳細（SCR-201）

#### 使用 API

- GET /tasks/{task_id}
- PATCH /tasks/{task_id}
- POST /tasks/{task_id}/complete
- POST /tasks/{task_id}/reopen

#### 非使用 API

- 上記以外の全 API

---

### タスク作成（SCR-202）

#### 使用 API

- POST /tasks

#### 非使用 API

- 上記以外の全 API

---

### タスク編集（SCR-203）

#### 使用 API

- GET /tasks/{task_id}
- PATCH /tasks/{task_id}
- DELETE /tasks/{task_id}

#### 非使用 API

- 上記以外の全 API

---

### 固定予定一覧（対象日）（SCR-300）

#### 使用 API

- GET /events?date=YYYY-MM-DD
- POST /events
- PATCH /events/{event_id}
- DELETE /events/{event_id}

#### 非使用 API

- 上記以外の全 API

---

### 固定予定詳細（SCR-301）

#### 使用 API

- GET /events/{event_id}
- PATCH /events/{event_id}
- DELETE /events/{event_id}

#### 非使用 API

- 上記以外の全 API

---

### 固定予定作成（SCR-302）

#### 使用 API

- POST /events

#### 非使用 API

- 上記以外の全 API

---

### 固定予定編集（SCR-303）

#### 使用 API

- GET /events/{event_id}
- PATCH /events/{event_id}
- DELETE /events/{event_id}

#### 非使用 API

- 上記以外の全 API

---

### 計画一覧（SCR-400）

#### 使用 API

- GET /plans

#### 非使用 API

- 上記以外の全 API

---

### 計画生成（条件入力）（SCR-401）

#### 使用 API

- POST /plans/generate

#### 非使用 API

- 上記以外の全 API

---

### 計画詳細（タイムライン）（SCR-402）

#### 使用 API

- GET /plans/{plan_id}
- GET /plans/{plan_id}/blocks

#### 非使用 API

- 上記以外の全 API

---

### overflow / warnings 詳細（SCR-403）

#### 使用 API

- GET /plans/{plan_id}
- GET /plans/{plan_id}/blocks

#### 非使用 API

- 上記以外の全 API

---

## 4. 補足・制約

### 4.1 計画生成画面（SCR-401）の制約

- SCR-401 は計画生成専用画面とし、使用 API は `POST /plans/generate` のみとする
- Task / Event の取得は `POST /plans/generate` のサーバ内部処理で実施する

### 4.2 表示専用画面の制約

- SCR-402 / SCR-403 は表示専用画面とし、更新系 API は使用しない

### 4.3 ホーム画面（SCR-100）の位置付け

- SCR-100 は遷移起点となる画面であり、操作系 API は使用しない
- 参照系 API のみを使用し、詳細操作は各機能画面に委譲する
