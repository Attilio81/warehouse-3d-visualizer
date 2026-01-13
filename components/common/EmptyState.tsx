import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    className = ''
}) => {
    return (
        <div className={`flex items-center justify-center py-12 ${className}`}>
            <div className="text-center">
                <Icon size={48} className="mx-auto text-slate-600 mb-4" />
                <div className="text-slate-400 text-lg font-medium">{title}</div>
                <div className="text-slate-500 text-sm mt-1">
                    {description}
                </div>
            </div>
        </div>
    );
};
