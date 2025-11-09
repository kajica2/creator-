
import React from 'react';
import { useGame } from '../hooks/useGameLogic';
import { AETHENEUM_DATA } from '../constants';
import { AetheneumNode } from '../types';
import { InsightIcon } from './icons/StatIcons';

const NodeLine: React.FC<{ from: AetheneumNode, to: AetheneumNode }> = ({ from, to }) => {
    return (
        <line
            x1={from.position.x}
            y1={from.position.y}
            x2={to.position.x}
            y2={to.position.y}
            stroke="rgba(100, 116, 139, 0.5)"
            strokeWidth="0.5"
        />
    );
};

const AetheneumView: React.FC = () => {
    const { state, unlockAetheneumNode } = useGame();

    const handleUnlock = (node: AetheneumNode) => {
        if (state.ip >= node.ipCost && !state.unlockedAetheneumNodes.includes(node.id)) {
            unlockAetheneumNode(node.id, node.ipCost);
        }
    };

    return (
        <div>
            <h2 className="text-4xl font-bold text-center text-amber-100 mb-8">Aetheneum</h2>
            <div className="relative w-full h-[80vh] bg-slate-800/30 rounded-xl border border-slate-700 p-4 overflow-auto">
                <svg viewBox="0 0 100 100" className="absolute top-0 left-0 w-full h-full">
                    {AETHENEUM_DATA.map(node => {
                        if (node.parent) {
                            const parentNode = AETHENEUM_DATA.find(p => p.id === node.parent);
                            if (parentNode) {
                                return <NodeLine key={`${node.id}-${parentNode.id}`} from={parentNode} to={node} />;
                            }
                        }
                        return null;
                    })}
                </svg>
                {AETHENEUM_DATA.map(node => {
                    const isUnlocked = state.unlockedAetheneumNodes.includes(node.id);
                    const canUnlock = node.parent ? state.unlockedAetheneumNodes.includes(node.parent) && state.ip >= node.ipCost : state.ip >= node.ipCost;
                    const isUnlockable = !isUnlocked && canUnlock;

                    return (
                        <div
                            key={node.id}
                            className={`absolute p-3 rounded-lg border-2 transition-all duration-500 transform -translate-x-1/2 -translate-y-1/2 ${
                                isUnlocked ? 'bg-amber-800/50 border-amber-400' : 
                                isUnlockable ? 'bg-slate-600/70 border-slate-500 cursor-pointer hover:border-amber-300' :
                                'bg-slate-800/50 border-slate-700 filter grayscale opacity-60'
                            }`}
                            style={{ left: `${node.position.x}%`, top: `${node.position.y}%` }}
                            onClick={() => isUnlockable && handleUnlock(node)}
                        >
                            <h4 className="font-bold text-sm text-center">{node.name}</h4>
                            {!isUnlocked && (
                                <div className="flex items-center justify-center text-xs mt-1 text-slate-300">
                                    <InsightIcon className="w-3 h-3 mr-1" />
                                    <span>{node.ipCost}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AetheneumView;
