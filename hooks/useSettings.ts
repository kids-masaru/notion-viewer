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

// デフォルト設定を読み込む（config.tsがあれば）
async function loadDefaultConfig(): Promise<Settings> {
    try {
        const { defaultConfig } = await import('../config');
        return {
            apiKey: defaultConfig.apiKey || '',
            databases: defaultConfig.databases || [],
            widgets: defaultConfig.widgets || [],
        };
    } catch (e) {
        // config.tsが存在しない場合は空の設定を返す
        return DEFAULT_SETTINGS;
    }
}

export function useSettings() {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        async function initialize() {
            // config.tsからデフォルト設定を読み込む
            const defaultConfig = await loadDefaultConfig();

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
                }
            } else {
                // localStorageにない場合はdefaultConfigを使用
                setSettings(defaultConfig);
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
