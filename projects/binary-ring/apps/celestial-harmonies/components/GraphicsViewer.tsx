
import React from 'react';
import { Geometry } from '../types';

interface GraphicsViewerProps {
    geometry: Geometry;
    isPlaying: boolean;
    playbackTime: number;
}

export const GraphicsViewer: React.FC<GraphicsViewerProps> = ({ geometry, isPlaying, playbackTime }) => {
    const renderElement = (el: any, index: number) => {
        const animationDelay = (el.props.animationDelay || 0) + 'ms';
        const animationDuration = isPlaying ? (playbackTime + 'ms') : '1.5s';

        const style = {
            '--animation-delay': animationDelay,
            '--animation-duration': animationDuration,
        } as React.CSSProperties;

        const commonProps = {
            key: index,
            ...el.props,
            className: `${el.props.className || ''} ${isPlaying && el.id ? 'animate-pulse-node' : ''}`,
            style
        };

        switch (el.type) {
            case 'circle':
                return <circle {...commonProps} />;
            case 'line':
                return <line {...commonProps} />;
            case 'path':
                return <path {...commonProps} />;
            case 'text':
                 return <text {...commonProps}>{el.props.content}</text>;
            case 'polygon':
                return <polygon {...commonProps} />;
            default:
                return null;
        }
    };

    return (
        <div className="w-full h-full aspect-square flex justify-center items-center">
             <style>{`
                @keyframes pulse-node {
                    0% { stroke: #facc15; }
                    50% { stroke: #fde047; }
                    100% { stroke: #facc15; }
                }
                .animate-pulse-node {
                    animation-name: pulse-node;
                    animation-duration: 500ms;
                    animation-iteration-count: infinite;
                    animation-timing-function: ease-in-out;
                    animation-delay: var(--animation-delay);
                }
                
                @keyframes draw {
                    to { stroke-dashoffset: 0; }
                }
                .drawing {
                    stroke-dasharray: 1000;
                    stroke-dashoffset: 1000;
                    animation: draw var(--animation-duration) ease-out forwards;
                    animation-delay: var(--animation-delay);
                }
            `}</style>
            <svg viewBox="-350 -350 700 700" className="w-full h-full">
                <g fill="none" stroke="rgb(100 116 139)" strokeWidth="1">
                    {geometry.map(renderElement)}
                </g>
            </svg>
        </div>
    );
};
