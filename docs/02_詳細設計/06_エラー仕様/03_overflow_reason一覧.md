# 詳細設計：overflow reason 一覧（MVP）

## 1. 本書の目的

overflow に含まれる reason コードの意味を定義し、UI 表示・テストの基準とする。

---

## 2. reason 一覧

| reason                     | 意味                       |
| -------------------------- | -------------------------- |
| not_enough_free_time       | 総作業時間が不足している   |
| not_enough_continuous_time | 連続した時間が確保できない |
| out_of_availability_window | 実行可能期間外             |
| remaining_too_small        | 最小ブロック未満の残り     |

---

## 3. 運用ルール

- reason は固定値とする
- UI では reason に応じた説明文を表示してよい
- API は reason の意味を変更しない
