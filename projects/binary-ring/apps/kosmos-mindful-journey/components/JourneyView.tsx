
import React from 'react';
import { useGame } from '../hooks/useGameLogic';
import { SPHERES_DATA, ARTIFACTS_DATA } from '../constants';
import { Sphere, Activity } from '../types';

interface JourneyViewProps {
    onStartActivity: (activity: Activity) => void;
}

const SphereCard: React.FC<{ sphere: Sphere, isUnlocked: boolean, isActive: boolean, isCompleted: boolean, requiredArtifactName: string | null, onStartQuest: () => void }> = 
({ sphere, isUnlocked, isActive, isCompleted, requiredArtifactName, onStartQuest }) => {
    const cardStateClasses = isUnlocked
        ? isActive 
            ? 'bg-slate-700/50 border-amber-300 shadow-lg shadow-amber-300/10' 
            : 'bg-slate-800/50 border-slate-600'
        : 'bg-slate-800/80 border-slate-700 filter grayscale opacity-60';

    return (
        <div className={`p-6 rounded-xl border transition-all duration-500 ${cardStateClasses}`}>
            <h2 className="text-3xl font-bold mb-2 text-amber-100">{sphere.name}</h2>
            <p className="text-slate-400 mb-4">{sphere.theme}</p>
            <p className="text-slate-300 mb-6 min-h-[3rem]">{sphere.description}</p>
            {isUnlocked ? (
                isActive ? (
                    <button onClick={onStartQuest} className="w-full bg-amber-400 text-slate-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-300 transition-colors duration-300">
                        Begin Quest: {sphere.quest.description}
                    </button>
                ) : (
                    <div className="text-center text-green-400 font-semibold">Completed</div>
                )
            ) : (
                <div className="text-center text-slate-500">
                    <p>Locked</p>
                    {requiredArtifactName && <p className="text-xs">Requires: {requiredArtifactName}</p>}
                </div>
            )}
        </div>
    );
};

const JourneyView: React.FC<JourneyViewProps> = ({ onStartActivity }) => {
    const { state } = useGame();
    const currentLevel = state.level;

    return (
        <div className="space-y-8">
            {SPHERES_DATA.map(sphere => {
                const isUnlocked = currentLevel >= sphere.unlocksAtLevel;
                const isActive = currentLevel === sphere.unlocksAtLevel;

                const requiredArtifact = sphere.artifactToCraft ? ARTIFACTS_DATA.find(a => a.id === sphere.artifactToCraft) : null;
                const canAscend = requiredArtifact ? state.craftedArtifacts.includes(requiredArtifact.id) : true;
                const isTrulyUnlocked = isUnlocked && (sphere.unlocksAtLevel === 1 || canAscend || currentLevel > sphere.unlocksAtLevel);

                return (
                    <SphereCard
                        key={sphere.id}
                        sphere={sphere}
                        isUnlocked={isTrulyUnlocked}
                        isActive={isActive && isTrulyUnlocked}
                        isCompleted={currentLevel > sphere.unlocksAtLevel}
                        requiredArtifactName={!isTrulyUnlocked && requiredArtifact ? requiredArtifact.name : null}
                        onStartQuest={() => onStartActivity({ type: sphere.quest.activity, sphere: sphere, duration: sphere.quest.duration })}
                    />
                );
            })}
        </div>
    );
};

export default JourneyView;
