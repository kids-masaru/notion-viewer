import React from 'react';
import { ExternalLink, Calendar, Tag } from 'lucide-react';

interface NotionPage {
    id: string;
    url: string;
    cover?: { type: string; external?: { url: string }; file?: { url: string } } | null;
    properties: Record<string, any>;
    icon?: { type: string; emoji?: string; external?: { url: string }; file?: { url: string } } | null;
}

interface CardViewProps {
    items: NotionPage[];
}

export default function CardView({ items }: CardViewProps) {
    const getTitle = (page: NotionPage) => {
        const titleProp = Object.values(page.properties).find((p) => p.id === 'title');
        if (!titleProp) return 'Untitled';
        return titleProp.title?.[0]?.plain_text || 'Untitled';
    };

    const getCoverUrl = (page: NotionPage) => {
        if (page.cover?.type === 'external') return page.cover.external?.url;
        if (page.cover?.type === 'file') return page.cover.file?.url;
        return null;
    };

    const getTags = (page: NotionPage) => {
        // Try to find a multi_select or select property
        const tagProp = Object.values(page.properties).find(
            (p) => p.type === 'multi_select' || p.type === 'select'
        );
        if (!tagProp) return [];
        if (tagProp.type === 'multi_select') return tagProp.multi_select;
        if (tagProp.type === 'select' && tagProp.select) return [tagProp.select];
        return [];
    };

    const getDate = (page: NotionPage) => {
        const dateProp = Object.values(page.properties).find((p) => p.type === 'date');
        if (dateProp?.date?.start) return dateProp.date.start;
        const createdTime = (page as any).created_time; // Fallback
        return createdTime ? createdTime.split('T')[0] : null;
    };

    return (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 p-4">
            {items.map((page) => {
                const coverUrl = getCoverUrl(page);
                const title = getTitle(page);
                const tags = getTags(page);
                const date = getDate(page);

                return (
                    <a
                        key={page.id}
                        href={page.url} // Use the official Notion URL
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block break-inside-avoid bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100"
                    >
                        {coverUrl && (
                            <div className="relative aspect-video w-full overflow-hidden">
                                <img
                                    src={coverUrl}
                                    alt={title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                        )}
                        <div className="p-3">
                            <h3 className="font-bold text-gray-900 text-sm leading-tight mb-2">
                                {page.icon?.emoji && <span className="mr-1">{page.icon.emoji}</span>}
                                {title}
                            </h3>

                            <div className="flex flex-wrap gap-1 mb-2">
                                {tags.map((tag: any) => (
                                    <span
                                        key={tag.id}
                                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium`}
                                        style={{
                                            backgroundColor: tag.color === 'default' ? '#e5e7eb' : `var(--notion-${tag.color}-bg, #e5e7eb)`,
                                            color: tag.color === 'default' ? '#374151' : `var(--notion-${tag.color}-text, #374151)`,
                                        }}
                                    >
                                        {tag.name}
                                    </span>
                                ))}
                            </div>

                            {date && (
                                <div className="flex items-center text-[10px] text-gray-400">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {date}
                                </div>
                            )}
                        </div>
                    </a>
                );
            })}
        </div>
    );
}
