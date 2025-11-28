// デフォルト設定ファイル
// このファイルをコピーして config.ts として保存し、あなたの設定を入力してください

import { DatabaseConfig, WidgetConfig } from './hooks/useSettings';

export const defaultConfig = {
    // Notion API Key
    apiKey: '', // ここにあなたのNotion API Keyを入力

    // デフォルトで表示するデータベース
    databases: [
        // 例:
        // {
        //   id: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        //   name: 'タスク管理',
        //   viewType: 'card' as const,
        // },
        // {
        //   id: 'yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy',
        //   name: 'メモ',
        //   viewType: 'list' as const,
        // },
    ] as DatabaseConfig[],

    // デフォルトで表示するウィジェット（オプション）
    widgets: [
        // 例:
        // {
        //   id: crypto.randomUUID(),
        //   name: '天気予報',
        //   url: 'https://example.com/weather',
        // },
    ] as WidgetConfig[],
};
