import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, LayoutGrid, List as ListIcon, Globe } from 'lucide-react';
import { Settings } from '@/hooks/useSettings';
import CardView from './CardView';
import ListView from './ListView';
import TaskDetailModal from './TaskDetailModal';
import FilterBar from './FilterBar';
import PropertyFilters, { PropertyFilter } from './PropertyFilters';
import PropertySelector from './PropertySelector';

interface DashboardProps {
    settings: Settings;
    onOpenSettings: () => void;
    onUpdateDatabaseSettings: (dbId: string, settings: { visibleProperties?: string[] }) => void;
}

export default function Dashboard({ settings, onOpenSettings, onUpdateDatabaseSettings }: DashboardProps) {
    const [activeTabId, setActiveTabId] = useState<string | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalTask, setModalTask] = useState<any | null>(null);
    const [filterText, setFilterText] = useState('');
    const [propertyFilters, setPropertyFilters] = useState<PropertyFilter[]>([]);
    const [visibleProperties, setVisibleProperties] = useState<string[]>([]);

    // Set initial active tab
    useEffect(() => {
        if (!activeTabId) {
            if (settings.databases.length > 0) {
                setActiveTabId(settings.databases[0].id);
            } else if (settings.widgets.length > 0) {
                setActiveTabId(settings.widgets[0].id);
            }
        }
    }, [settings.databases, settings.widgets, activeTabId]);

    const activeDatabase = settings.databases.find((db) => db.id === activeTabId);
    const activeWidget = settings.widgets.find((w) => w.id === activeTabId);

    useEffect(() => {
        async function fetchData() {
            if (!activeDatabase || !settings.apiKey) return;

            setLoading(true);
            setError(null);
            try {
                const res = await fetch('/api/notion', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${settings.apiKey}`,
                    },
                    body: JSON.stringify({
                        database_id: activeDatabase.id,
                        // Add sorts or filters if needed
                        sorts: [
                            {
                                timestamp: 'created_time',
                                direction: 'descending',
                            },
                        ],
                    }),
                });

                const json = await res.json();

                if (!res.ok) {
                    throw new Error(json.error || 'Failed to fetch data');
                }

                setData(json.results);
            } catch (err: any) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        if (activeDatabase) {
            fetchData();
        }
    }, [activeDatabase, settings.apiKey]);

    // Apply property filters first
    const propertyFilteredData = data.filter((item) => {
        if (propertyFilters.length === 0) return true;

        return propertyFilters.every(filter => {
            const prop = item.properties[filter.propertyName] as any;
            if (!prop) return false;

            // Date filter
            if (filter.propertyType === 'date') {
                if (!prop.date?.start) return false;
                const itemDate = new Date(prop.date.start);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                switch (filter.condition) {
                    case 'today':
                        return itemDate.toDateString() === today.toDateString();
                    case 'this_week':
                        const weekStart = new Date(today);
                        weekStart.setDate(today.getDate() - today.getDay());
                        const weekEnd = new Date(weekStart);
                        weekEnd.setDate(weekStart.getDate() + 7);
                        return itemDate >= weekStart && itemDate < weekEnd;
                    case 'this_month':
                        return itemDate.getMonth() === today.getMonth() &&
                            itemDate.getFullYear() === today.getFullYear();
                    case 'past':
                        return itemDate < today;
                    case 'future':
                        return itemDate > today;
                    default:
                        return true;
                }
            }

            // Select/Multi-select filter
            if (filter.propertyType === 'select' || filter.propertyType === 'multi_select') {
                if (!filter.values || filter.values.length === 0) return true;

                if (prop.type === 'select') {
                    return filter.values.includes(prop.select?.name);
                }
                if (prop.type === 'multi_select') {
                    return prop.multi_select.some((tag: any) =>
                        filter.values!.includes(tag.name)
                    );
                }
            }

            // Checkbox filter
            if (filter.propertyType === 'checkbox') {
                if (filter.condition === 'checked') {
                    return prop.checkbox === true;
                }
                if (filter.condition === 'unchecked') {
                    return prop.checkbox === false;
                }
            }

            return true;
        });
    });

    // Then apply text search filter
    const filteredData = propertyFilteredData.filter((item) => {
        if (!filterText) return true;

        const searchLower = filterText.toLowerCase();

        // Search in all properties
        for (const [key, prop] of Object.entries(item.properties)) {
            if (!prop) continue;

            const typedProp = prop as any;

            // Title
            if (typedProp.type === 'title' && typedProp.title) {
                const titleText = typedProp.title.map((t: any) => t.plain_text).join('').toLowerCase();
                if (titleText.includes(searchLower)) return true;
            }

            // Rich text
            if (typedProp.type === 'rich_text' && typedProp.rich_text) {
                const text = typedProp.rich_text.map((t: any) => t.plain_text).join('').toLowerCase();
                if (text.includes(searchLower)) return true;
            }

            // Select
            if (typedProp.type === 'select' && typedProp.select?.name) {
                if (typedProp.select.name.toLowerCase().includes(searchLower)) return true;
            }

            // Multi-select
            if (typedProp.type === 'multi_select' && typedProp.multi_select) {
                const hasMatch = typedProp.multi_select.some((tag: any) =>
                    tag.name.toLowerCase().includes(searchLower)
                );
                if (hasMatch) return true;
            }

            // Number, email, phone, url
            if (['number', 'email', 'phone_number', 'url'].includes(typedProp.type)) {
                const value = String(typedProp[typedProp.type] || '').toLowerCase();
                if (value.includes(searchLower)) return true;
            }
        }

        return false;
    });

    const renderContent = () => {
        if (!settings.apiKey && settings.databases.length > 0) {
            return (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <p>Please configure your Notion API Key in settings.</p>
                    <button onClick={onOpenSettings} className="mt-4 text-blue-600 font-medium">
                        Open Settings
                    </button>
                </div>
            );
        }

        if (activeWidget) {
            return (
                <div className="w-full h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 mt-4">
                    <iframe
                        src={activeWidget.url}
                        className="w-full h-full border-0"
                        title={activeWidget.name}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            );
        }

        if (activeDatabase) {
            if (loading) {
                return (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                );
            }

            if (error) {
                return (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl mt-4 border border-red-100">
                        Error: {error}
                    </div>
                );
            }

            if (activeDatabase.viewType === 'list') {
                return (
                    <ListView
                        items={filteredData}
                        onTaskClick={setModalTask}
                        visibleProperties={visibleProperties}
                    />
                );
            }
            return (
                <CardView
                    items={filteredData}
                    onTaskClick={setModalTask}
                    visibleProperties={visibleProperties}
                />
            );
        }

        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <LayoutGrid className="w-12 h-12 mb-2 opacity-20" />
                <p>No databases or widgets configured.</p>
                <button onClick={onOpenSettings} className="mt-4 text-blue-600 font-medium">
                    Add Content
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">My Dashboard</h1>
                <button
                    onClick={onOpenSettings}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <SettingsIcon className="w-5 h-5 text-gray-600" />
                </button>
            </header>

            {/* Tabs */}
            {(settings.databases.length > 0 || settings.widgets.length > 0) && (
                <div className="px-4 py-3 overflow-x-auto no-scrollbar">
                    <div className="flex gap-2">
                        {settings.databases.map((db) => (
                            <button
                                key={db.id}
                                onClick={() => setActiveTabId(db.id)}
                                className={`flex items-center px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeTabId === db.id
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {db.viewType === 'card' ? (
                                    <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
                                ) : (
                                    <ListIcon className="w-3.5 h-3.5 mr-1.5" />
                                )}
                                {db.name}
                            </button>
                        ))}
                        {settings.widgets.map((w) => (
                            <button
                                key={w.id}
                                onClick={() => setActiveTabId(w.id)}
                                className={`flex items-center px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeTabId === w.id
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <Globe className="w-3.5 h-3.5 mr-1.5" />
                                {w.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            {activeDatabase && (
                <>
                    <FilterBar
                        filterText={filterText}
                        onFilterChange={setFilterText}
                        resultCount={filteredData.length}
                        totalCount={data.length}
                    >
                        <PropertySelector
                            data={data}
                            visibleProperties={visibleProperties}
                            onChange={handleVisiblePropertiesChange}
                        />
                    </FilterBar>
                    <PropertyFilters
                        data={data}
                        activeFilters={propertyFilters}
                        onFilterChange={setPropertyFilters}
                    />
                </>
            )}

            {/* Content */}
            <main className="max-w-7xl mx-auto">
                {renderContent()}
            </main>

            {/* Task Detail Modal */}
            <TaskDetailModal task={modalTask} onClose={() => setModalTask(null)} />
        </div>
    );
}
