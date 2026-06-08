import React from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type MessageBarIntent = 'info' | 'success' | 'warning' | 'error';

interface MessageBarProps {
  intent?: MessageBarIntent;
  children: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
}

const intentStyles = {
  info: 'bg-[#f3f2f1] text-[#242424] border-[#d1d1d1]',
  success: 'bg-[#dff6dd] text-[#107c10] border-[#c1dfc1]',
  warning: 'bg-[#fff4ce] text-[#797775] border-[#fde7a9]',
  error: 'bg-[#fde7e9] text-[#a4262c] border-[#f3d6d8]'
};

const intentIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  error: XCircle
};

export const MessageBar: React.FC<MessageBarProps> = ({ 
  intent = 'info', 
  children, 
  className,
  onDismiss
}) => {
  const Icon = intentIcons[intent];

  return (
    <div className={cn(
      "flex items-start gap-3 px-4 py-3 rounded-md border text-sm font-medium transition-all",
      intentStyles[intent],
      className
    )}>
      <Icon className="h-5 w-5 shrink-0" strokeWidth={2.5} />
      <div className="flex-1">
        {children}
      </div>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-current opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss message"
        >
          <XCircle className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};
