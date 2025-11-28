import React from 'react';
import { FileText, Calendar } from 'lucide-react';

interface NotionPage {
    id: string;
    url: string;
    properties: Record<string, any>;
    icon?: { type: string; emoji?: string; external?: { url: string }; file?: { url: string } } | null;
}

interface ListViewProps {
    items: NotionPage[];
}

export default function ListView({ items }: ListViewProps) {
    const getTitle = (page: NotionPage) => {
        const titleProp = Object.values(page.properties).find((p) => p.id === 'title');
        if (!titleProp) return 'Untitled';
        return titleProp.title?.[0]?.plain_text || 'Untitled';
    };

    const getDate = (page: NotionPage) => {
        const dateProp = Object.values(page.properties).find((p) => p.type === 'date');
        if (dateProp?.date?.start) return dateProp.date.start;
        const createdTime = (page as any).created_time;
        return createdTime ? createdTime.split('T')[0] : null;
    };

    return (
        <div className="flex flex-col gap-2 p-4">
            {items.map((page) => {
                const title = getTitle(page);
                const date = getDate(page);

                return (
                    <a
                        key={page.id}
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                        <div className="mr-3 text-xl">
                            {page.icon?.emoji || <FileText className="w-5 h-5 text-gray-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 text-sm truncate">{title}</h3>
                            {date && (
                                <div className="flex items-center text-[10px] text-gray-400 mt-0.5">
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
