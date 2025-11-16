# Habit Tracker 101

習慣トラッキングアプリ「HabitGrid」のリポジトリです。

## プロジェクト構造

```
habit-tracker-101/
├── habitgrid/          # メインアプリケーション
│   ├── src/           # ソースコード
│   ├── public/        # 静的ファイル
│   └── ...            # 設定ファイル
└── README.md          # このファイル

```

## セットアップ

```bash
cd habitgrid
npm install
npm run dev
```

## 機能

- 習慣の作成と管理
- 週単位での進捗トラッキング
- ストリーク（連続日数）のカウント
- 時間帯に応じた背景色の変更（午前3時〜午後3時: アイボリー、それ以外: グレー）
- バックアップ・復元機能
- 統計データのエクスポート（CSV/JSON）
- 印刷機能
- 目標達成通知
- 習慣の履歴管理

## 技術スタック

- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
