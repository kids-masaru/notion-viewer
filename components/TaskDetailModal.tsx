import React from 'react';
import { X, ExternalLink, Calendar, Tag, CheckSquare, Hash, Link as LinkIcon, Type } from 'lucide-react';

interface NotionPage {
    id: string;
    url: string;
    properties: Record<string, any>;
    icon?: { type: string; emoji?: string; external?: { url: string }; file?: { url: string } } | null;
    cover?: { type: string; external?: { url: string }; file?: { url: string } } | null;
}

interface TaskDetailModalProps {
    task: NotionPage | null;
    onClose: () => void;
}

export default function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
    if (!task) return null;

    const getTitle = () => {
        const titleProp = Object.values(task.properties).find((p) => p.id === 'title');
        if (!titleProp) return 'Untitled';
        return titleProp.title?.[0]?.plain_text || 'Untitled';
    };

    const renderPropertyValue = (property: any) => {
        switch (property.type) {
            case 'title':
                return (
                    <div className="flex items-start gap-2">
                        <Type className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-900 font-medium">
                            {property.title?.[0]?.plain_text || 'Untitled'}
                        </span>
                    </div>
                );

            case 'rich_text':
                return (
                    <div className="flex items-start gap-2">
                        <Type className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">
                            {property.rich_text?.map((t: any) => t.plain_text).join('') || '—'}
                        </span>
                    </div>
                );

            case 'number':
                return (
                    <div className="flex items-start gap-2">
                        <Hash className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{property.number ?? '—'}</span>
                    </div>
                );

            case 'select':
                return property.select ? (
                    <div className="flex items-start gap-2">
                        <Tag className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span
                            className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                                backgroundColor: property.select.color === 'default' ? '#e5e7eb' : `var(--notion-${property.select.color}-bg, #e5e7eb)`,
                                color: property.select.color === 'default' ? '#374151' : `var(--notion-${property.select.color}-text, #374151)`,
                            }}
                        >
                            {property.select.name}
                        </span>
                    </div>
                ) : (
                    <span className="text-gray-400">—</span>
                );

            case 'multi_select':
                return (
                    <div className="flex items-start gap-2">
                        <Tag className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex flex-wrap gap-1">
                            {property.multi_select?.length > 0 ? (
                                property.multi_select.map((tag: any) => (
                                    <span
                                        key={tag.id}
                                        className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                                        style={{
                                            backgroundColor: tag.color === 'default' ? '#e5e7eb' : `var(--notion-${tag.color}-bg, #e5e7eb)`,
                                            color: tag.color === 'default' ? '#374151' : `var(--notion-${tag.color}-text, #374151)`,
                                        }}
                                    >
                                        {tag.name}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-400">—</span>
                            )}
                        </div>
                    </div>
                );

            case 'date':
                return (
                    <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">
                            {property.date?.start || '—'}
                            {property.date?.end && ` → ${property.date.end}`}
                        </span>
                    </div>
                );

            case 'checkbox':
                return (
                    <div className="flex items-start gap-2">
                        <CheckSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${property.checkbox ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className="text-gray-700">{property.checkbox ? 'Yes' : 'No'}</span>
                    </div>
                );

            case 'url':
                return property.url ? (
                    <div className="flex items-start gap-2">
                        <LinkIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <a
                            href={property.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate"
                        >
                            {property.url}
                        </a>
                    </div>
                ) : (
                    <span className="text-gray-400">—</span>
                );

            case 'email':
                return property.email ? (
                    <div className="flex items-start gap-2">
                        <Type className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <a href={`mailto:${property.email}`} className="text-blue-600 hover:underline">
                            {property.email}
                        </a>
                    </div>
                ) : (
                    <span className="text-gray-400">—</span>
                );

            case 'phone_number':
                return (
                    <div className="flex items-start gap-2">
                        <Type className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{property.phone_number || '—'}</span>
                    </div>
                );

            case 'created_time':
            case 'last_edited_time':
                return (
                    <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">
                            {property[property.type] ? new Date(property[property.type]).toLocaleString('ja-JP') : '—'}
                        </span>
                    </div>
                );

            default:
                return <span className="text-gray-400 text-sm">{property.type}</span>;
        }
    };

    const getCoverUrl = () => {
        if (task.cover?.type === 'external') return task.cover.external?.url;
        if (task.cover?.type === 'file') return task.cover.file?.url;
        return null;
    };

    const coverUrl = getCoverUrl();
    const title = getTitle();

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {task.icon?.emoji && <span className="text-2xl">{task.icon.emoji}</span>}
                        <h2 className="text-xl font-bold text-gray-900 truncate">{title}</h2>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        <a
                            href={task.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Open in Notion
                        </a>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Cover Image */}
                {coverUrl && (
                    <div className="w-full h-48 flex-shrink-0">
                        <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                        {Object.entries(task.properties).map(([key, property]) => (
                            <div key={key} className="border-b border-gray-50 pb-3 last:border-0">
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    {key}
                                </div>
                                <div>{renderPropertyValue(property)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
