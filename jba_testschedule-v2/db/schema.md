# JBA Schedule App v2 — データベース設計

## アーキテクチャ

```
[Browser] → [Vercel (静的ホスティング)] → [Supabase (PostgreSQL + REST API)]
```

- **フロントエンド**: HTML/CSS/JS（Vercel でホスティング）
- **バックエンド**: Supabase（PostgreSQL + PostgREST 自動API + RLS）
- **認証**: 将来対応（現時点はanon key全許可）

## テーブル構成（10テーブル + 2ビュー）

```
members              ... チームメンバーマスター (9役割)
projects             ... 案件 (client, media_type)
project_members      ... プロジェクト⇔メンバー 中間
gous                 ... 号 (project_id FK)
kikakus              ... 企画 (gou_id FK, page_num, meta_*)
tasks                ... 工程 (kikaku_id FK, assignee, status, dates)
task_assignee_history ... 担当者変更履歴
time_schedules       ... タイムライン配置 (member×date×hour)
custom_fmts          ... カスタムFMTテンプレート (steps JSONB)
app_settings         ... アプリ設定 (key-value)

v_tasks_flat         ... ビュー: 4階層フラットJOIN
v_project_progress   ... ビュー: プロジェクト進捗サマリー
```

## 4階層データモデル

```
projects (案件)
  └── gous (号)
        └── kikakus (企画)
              └── tasks (工程)
```

## SQLファイル
- `supabase_schema.sql` — Supabase SQL Editorで実行するDDL一式

## 旧localStorage形式
- キー: `creative-task-mgr-v3` / `custom-fmts`
- マイグレーション: localStorage → Supabase は `js/app.js` 内で対応予定

## RLS（Row Level Security）
- 全テーブルRLS有効
- 現時点: anon/authenticated 全許可ポリシー（開発用）
- 認証導入時: ユーザーごとのポリシーに切り替え
