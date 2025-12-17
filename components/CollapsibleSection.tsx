import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: number;
  badgeColor?: string;
  headerClassName?: string;
  accentColor?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  defaultOpen = false,
  children,
  badge,
  badgeColor = 'bg-blue-500',
  headerClassName = '',
  accentColor
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(defaultOpen ? undefined : 0);

  useEffect(() => {
    if (isOpen) {
      const contentEl = contentRef.current;
      if (contentEl) {
        setHeight(contentEl.scrollHeight);
        // After animation, set to auto for dynamic content
        const timer = setTimeout(() => setHeight(undefined), 200);
        return () => clearTimeout(timer);
      }
    } else {
      setHeight(0);
    }
  }, [isOpen]);

  return (
    <div className="border-b border-slate-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors ${headerClassName}`}
      >
        <div className="flex items-center gap-2">
          {icon && (
            <span className={accentColor ? accentColor : 'text-slate-400'}>
              {icon}
            </span>
          )}
          <span className={`text-xs font-semibold uppercase tracking-wider ${accentColor ? accentColor : 'text-slate-300'}`}>
            {title}
          </span>
          {badge !== undefined && badge > 0 && (
            <span className={`${badgeColor} text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold`}>
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        style={{ height: height !== undefined ? `${height}px` : 'auto' }}
        className="overflow-hidden transition-[height] duration-200 ease-out"
      >
        <div ref={contentRef} className="px-3 pb-3">
          {children}
        </div>
      </div>
    </div>
  );
};
