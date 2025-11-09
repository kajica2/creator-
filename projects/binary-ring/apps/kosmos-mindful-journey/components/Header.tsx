
import React from 'react';
import { useGame } from '../hooks/useGameLogic';
import { EnergyIcon, InsightIcon } from './icons/StatIcons';

const Header: React.FC = () => {
    const { state } = useGame();
    const energyPercentage = (state.energy / state.maxEnergy) * 100;

    return (
        <header className="px-4 py-3 bg-slate-900/50 backdrop-blur-sm border-b border-slate-700">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-amber-200 tracking-wider">Kosmos</h1>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <EnergyIcon />
                        <div className="w-24 bg-slate-700 rounded-full h-2.5">
                            <div
                                className="bg-gradient-to-r from-teal-400 to-cyan-500 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${energyPercentage}%` }}
                            ></div>
                        </div>
                        <span className="text-sm font-semibold">{state.energy}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <InsightIcon />
                        <span className="text-sm font-semibold">{state.ip}</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
