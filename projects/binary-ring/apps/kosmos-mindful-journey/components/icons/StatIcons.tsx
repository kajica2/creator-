
import React from 'react';

export const EnergyIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5 text-cyan-400" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
    </svg>
);

export const InsightIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5 text-amber-300" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0L7.18 7.95c-.34.21-.72.36-1.12.43l-5.1.75c-1.63.24-2.28 2.22-1.1 3.35l3.69 3.6c.28.27.4.66.33.1.05l-.87 5.08c-.28 1.62 1.42 2.85 2.92 2.15l4.55-2.39c.36-.19.78-.19 1.14 0l4.55 2.39c1.5 1.7 3.2-.53 2.92-2.15l-.87-5.08c-.07-.44.05-.83.33-1.1l3.69-3.6c1.18-1.13.53-3.1-1.1-3.35l-5.1-.75c-.4-.06-.78-.22-1.12-.43L11.49 3.17z" clipRule="evenodd" />
    </svg>
);
