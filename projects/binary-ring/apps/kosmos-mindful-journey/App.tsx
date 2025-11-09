
import React, { useState, useCallback } from 'react';
import { GameProvider, useGame } from './hooks/useGameLogic';
import Header from './components/Header';
import JourneyView from './components/JourneyView';
import GridView from './components/GridView';
import AetheneumView from './components/AetheneumView';
import ActivityModal from './components/ActivityModal';
import { Activity, View } from './types';
import { JourneyIcon, GridIcon, AetheneumIcon } from './components/icons/NavigationIcons';

const MainApp: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('journey');
    const [activeActivity, setActiveActivity] = useState<Activity | null>(null);
    const { state, ascendSphere, completeJournalEntry } = useGame();

    const handleStartActivity = useCallback((activity: Activity) => {
        setActiveActivity(activity);
    }, []);

    const handleCloseActivity = useCallback(() => {
        setActiveActivity(null);
    }, []);

    const renderView = () => {
        switch (currentView) {
            case 'journey':
                return <JourneyView onStartActivity={handleStartActivity} />;
            case 'grid':
                return <GridView />;
            case 'aetheneum':
                return <AetheneumView />;
            default:
                return <JourneyView onStartActivity={handleStartActivity} />;
        }
    };

    const NavItem: React.FC<{ view: View; label: string; icon: React.ReactNode }> = ({ view, label, icon }) => (
        <button
            onClick={() => setCurrentView(view)}
            className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-300 ${currentView === view ? 'text-amber-300' : 'text-slate-400 hover:text-amber-200'}`}
        >
            {icon}
            <span className="text-xs tracking-wider">{label}</span>
        </button>
    );

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-slate-200 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
            <Header />
            <main className="flex-grow overflow-y-auto p-4 pb-20">
                {renderView()}
            </main>
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-sm border-t border-slate-700 flex">
                <NavItem view="journey" label="Journey" icon={<JourneyIcon />} />
                <NavItem view="grid" label="Grid" icon={<GridIcon />} />
                <NavItem view="aetheneum" label="Aetheneum" icon={<AetheneumIcon />} />
            </nav>
            {activeActivity && (
                <ActivityModal
                    activity={activeActivity}
                    onClose={handleCloseActivity}
                />
            )}
        </div>
    );
};


const App: React.FC = () => (
    <GameProvider>
        <MainApp />
    </GameProvider>
);

export default App;
