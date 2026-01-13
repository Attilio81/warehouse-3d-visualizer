import React from 'react';
import { AlertCircle, Check, AlertTriangle, Info } from 'lucide-react';

export type AlertType = 'error' | 'success' | 'warning' | 'info';

interface AlertProps {
    type: AlertType;
    title?: string;
    children: React.ReactNode;
    className?: string;
}

const styles = {
    error: {
        container: 'bg-red-900/30 border-red-700 text-red-300',
        icon: AlertCircle,
        iconColor: 'text-red-400',
        titleColor: 'text-red-400',
    },
    success: {
        container: 'bg-green-900/30 border-green-700 text-green-300',
        icon: Check,
        iconColor: 'text-green-400',
        titleColor: 'text-green-400',
    },
    warning: {
        container: 'bg-yellow-900/30 border-yellow-700 text-yellow-300',
        icon: AlertTriangle,
        iconColor: 'text-yellow-400',
        titleColor: 'text-yellow-400',
    },
    info: {
        container: 'bg-blue-900/30 border-blue-700 text-blue-300',
        icon: Info,
        iconColor: 'text-blue-400',
        titleColor: 'text-blue-400',
    },
};

export const Alert: React.FC<AlertProps> = ({ type, title, children, className = '' }) => {
    const style = styles[type];
    const Icon = style.icon;

    return (
        <div className={`p-3 border rounded-lg flex items-start gap-3 ${style.container} ${className}`}>
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.iconColor}`} />
            <div className="flex-1">
                {title && <div className={`font-medium mb-1 ${style.titleColor}`}>{title}</div>}
                <div className="text-sm">{children}</div>
            </div>
        </div>
    );
};
