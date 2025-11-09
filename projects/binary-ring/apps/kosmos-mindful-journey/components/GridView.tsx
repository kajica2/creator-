
import React from 'react';
import { useGame } from '../hooks/useGameLogic';
import { BLUEPRINTS_DATA } from '../constants';
import { Blueprint } from '../types';

const BlueprintGrid: React.FC<{ blueprint: Blueprint }> = ({ blueprint }) => {
    const { state } = useGame();
    const entriesForBlueprint = state.journalEntries.filter(e => e.blueprintId === blueprint.id);
    const completedNodes = entriesForBlueprint.length;
    const isCrafted = state.craftedArtifacts.includes(blueprint.unlocksArtifact);

    const radius = 5;
    const strokeWidth = 1.5;

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-2xl font-bold text-amber-200">{blueprint.name}</h3>
                    <p className="text-slate-400 mb-4">{blueprint.description}</p>
                </div>
                 {isCrafted && (
                     <div className="text-xs font-bold text-amber-300 bg-amber-900/50 px-3 py-1 rounded-full">CRAFTED</div>
                 )}
            </div>
           
            <div className="relative w-full aspect-square max-w-sm mx-auto mt-4">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Render connections later if needed */}
                    {blueprint.nodes.map((node, index) => {
                        const isFilled = index < completedNodes;
                        return (
                            <circle
                                key={index}
                                cx={node.x}
                                cy={node.y}
                                r={radius}
                                fill={isFilled ? 'url(#glow)' : 'rgba(30, 41, 59, 0.5)'}
                                stroke={isFilled ? 'rgb(253, 224, 71)' : 'rgb(71, 85, 105)'}
                                strokeWidth={strokeWidth}
                                className="transition-all duration-500"
                            />
                        );
                    })}
                     <defs>
                        <radialGradient id="glow">
                            <stop offset="0%" stopColor="rgba(253, 230, 138, 1)" />
                            <stop offset="70%" stopColor="rgba(252, 211, 77, 0.8)" />
                            <stop offset="100%" stopColor="rgba(252, 211, 77, 0)" />
                        </radialGradient>
                    </defs>
                </svg>
            </div>
             <div className="mt-4 text-center">
                <p className="text-slate-300 font-semibold">{completedNodes} / {blueprint.nodes.length} Insights Placed</p>
                <div className="w-full bg-slate-700 rounded-full h-2.5 mt-2">
                    <div
                        className="bg-gradient-to-r from-amber-400 to-amber-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${(completedNodes / blueprint.nodes.length) * 100}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};


const GridView: React.FC = () => {
    const { state } = useGame();

    return (
        <div className="space-y-8">
            <h2 className="text-4xl font-bold text-center text-amber-100">Your Journal Grids</h2>
            {state.unlockedBlueprints.map(blueprintId => {
                const blueprint = BLUEPRINTS_DATA.find(b => b.id === blueprintId);
                return blueprint ? <BlueprintGrid key={blueprintId} blueprint={blueprint} /> : null;
            })}
        </div>
    );
};

export default GridView;
