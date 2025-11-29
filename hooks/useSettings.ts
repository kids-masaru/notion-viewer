import { useState, useEffect } from 'react';

export type ViewType = 'card' | 'list';

export interface DatabaseConfig {
    id: string;
    name: string;
    viewType: ViewType;
}

export interface WidgetConfig {
    id: string;
    name: string;
    url: string;
}

export interface Settings {
    apiKey: string;
    databases: DatabaseConfig[];
    widgets: WidgetConfig[];
}

const DEFAULT_SETTINGS: Settings = {
    apiKey: '',
    databases: [],
    widgets: [],
};

// デフォルト設定を読み込む（環境変数から）
function loadDefaultConfig(): Settings {
    try {
        const envDatabases = process.env.NEXT_PUBLIC_DEFAULT_DATABASES;
        const envWidgets = process.env.NEXT_PUBLIC_DEFAULT_WIDGETS;

        let databases = [];
        try {
            const parsed = envDatabases ? JSON.parse(envDatabases) : [];
            databases = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Failed to parse NEXT_PUBLIC_DEFAULT_DATABASES:', envDatabases, e);
            databases = [];
        }

        let widgets = [];
        try {
            const parsed = envWidgets ? JSON.parse(envWidgets) : [];
            widgets = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Failed to parse NEXT_PUBLIC_DEFAULT_WIDGETS:', envWidgets, e);
            widgets = [];
        }

        return {
            apiKey: process.env.NEXT_PUBLIC_NOTION_API_KEY || '',
            databases,
            widgets,
        };
    } catch (e) {
        console.error('Failed to load default config:', e);
        return DEFAULT_SETTINGS;
    }
}

export function useSettings() {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        function initialize() {
            // 環境変数からデフォルト設定を読み込む
            const defaultConfig = loadDefaultConfig();

            // localStorageから保存された設定を読み込む
            const stored = localStorage.getItem('notion-viewer-settings');

            if (stored) {
                try {
                    const parsedSettings = JSON.parse(stored);
                    // localStorageの設定を優先し、不足部分をdefaultConfigで補完
                    setSettings({
                        apiKey: parsedSettings.apiKey || defaultConfig.apiKey,
                        databases: parsedSettings.databases.length > 0
                            ? parsedSettings.databases
                            : defaultConfig.databases,
                        widgets: parsedSettings.widgets.length > 0
                            ? parsedSettings.widgets
                            : defaultConfig.widgets,
                    });
                } catch (e) {
                    console.error('Failed to parse settings', e);
                    setSettings(defaultConfig);
                    // 保存
                    localStorage.setItem('notion-viewer-settings', JSON.stringify(defaultConfig));
                }
            } else {
                // localStorageにない場合はdefaultConfigを使用し、保存
                console.log('Initializing with default config from env:', defaultConfig);
                setSettings(defaultConfig);
                localStorage.setItem('notion-viewer-settings', JSON.stringify(defaultConfig));
            }

            setIsLoaded(true);
        }

        initialize();
    }, []);

    const updateSettings = (newSettings: Partial<Settings>) => {
        setSettings((prev) => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem('notion-viewer-settings', JSON.stringify(updated));
            return updated;
        });
    };

    const addDatabase = (db: DatabaseConfig) => {
        updateSettings({ databases: [...settings.databases, db] });
    };

    const removeDatabase = (id: string) => {
        updateSettings({ databases: settings.databases.filter((d) => d.id !== id) });
    };

    const addWidget = (widget: WidgetConfig) => {
        updateSettings({ widgets: [...settings.widgets, widget] });
    };

    const removeWidget = (id: string) => {
        updateSettings({ widgets: settings.widgets.filter((w) => w.id !== id) });
    };

    return {
        settings,
        isLoaded,
        updateSettings,
        addDatabase,
        removeDatabase,
        addWidget,
        removeWidget,
    };
}
