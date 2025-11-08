import React, { useState } from 'react';
import { Page } from '../types';

interface SidebarProps {
  activePage: Page;
  onPageChange: (page: Page) => void;
  isOpen: boolean;
  onClose: () => void;
}

// Icon Components
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10" /></svg>;
const CreationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const PersonaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const GalleryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const AccountIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const HashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>;
const PenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const BrainIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v2a1 1 0 110 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a1 1 0 110-2V5zm3 4a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1zm5 0a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const GlobeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m0 18a9 9 0 009-9m-9 9a9 9 0 00-9-9" /></svg>;
const TemplateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SubscriptionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const RoadmapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0l-6 3" /></svg>;
const TrophyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;

// Page groupings
const dashboardPages: Page[] = ['Gamification'];
const creationSuitePages: Page[] = ['Hashtag Manager', 'AI Story', 'AI Lyrics', 'AI Strategy', 'AI Skill', 'AI Mutator', 'AI Concept', 'Text-to-Image', 'Image Edit', 'Batch Images', 'Batch Prompts', 'AI Website', 'Thinking Mode', 'Audio Transcriber'];
const contentCreationPages: Page[] = ['AI Story', 'AI Lyrics', 'AI Strategy', 'AI Skill', 'AI Mutator', 'AI Concept'];
const imageStudioPages: Page[] = ['Text-to-Image', 'Image Edit', 'Batch Images', 'Batch Prompts'];
const advancedToolsPages: Page[] = ['Thinking Mode', 'Audio Transcriber'];
const personaPages: Page[] = ['Persona Templates'];
const galleryPages: Page[] = ['Gallery', 'Website Manager'];
const accountPages: Page[] = ['History', 'Subscription', 'Settings', 'Roadmap'];

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange, isOpen, onClose }) => {
    const [isDashboardOpen, setIsDashboardOpen] = useState(dashboardPages.includes(activePage));
    const [isCreationSuiteOpen, setIsCreationSuiteOpen] = useState(creationSuitePages.includes(activePage));
    const [isContentOpen, setIsContentOpen] = useState(contentCreationPages.includes(activePage));
    const [isImageOpen, setIsImageOpen] = useState(imageStudioPages.includes(activePage));
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(advancedToolsPages.includes(activePage));
    const [isPersonaOpen, setIsPersonaOpen] = useState(personaPages.includes(activePage));
    const [isGalleryOpen, setIsGalleryOpen] = useState(galleryPages.includes(activePage));
    const [isAccountOpen, setIsAccountOpen] = useState(accountPages.includes(activePage));

    const NavItem: React.FC<{ page: Page; icon: React.ReactNode; children?: React.ReactNode }> = ({ page, icon, children }) => {
        const isActive = activePage === page;
        return (
            <li>
                <button
                    onClick={() => onPageChange(page)}
                    className={`flex items-center w-full text-left p-2.5 rounded-lg transition-colors text-sm font-medium ${
                        isActive
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                    }`}
                >
                    {icon}
                    <span className="ml-3">{page}</span>
                </button>
            </li>
        );
    };

    const NavGroup: React.FC<{ title: string; icon: React.ReactNode; isOpen: boolean; onToggle: () => void; pages: Page[]; activeSubPages: Page[] }> = ({ title, icon, isOpen, onToggle, pages, activeSubPages }) => {
        const isActive = activeSubPages.some(p => pages.includes(p));
        return (
            <li>
                <button
                    onClick={onToggle}
                    className={`flex items-center justify-between w-full text-left p-2.5 rounded-lg transition-colors text-sm font-medium ${
                        isActive && !isOpen
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                    }`}
                >
                    <div className="flex items-center">
                        {icon}
                        <span className="ml-3">{title}</span>
                    </div>
                    <ChevronDownIcon style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>
                {isOpen && (
                    <ul className="pt-2 pl-4 mt-1 border-l border-gray-700 space-y-1">
                        {pages.map(page => <SubNavItem key={page} page={page} />)}
                    </ul>
                )}
            </li>
        );
    };

    const SubNavItem: React.FC<{ page: Page }> = ({ page }) => {
        const isActive = activePage === page;
        return (
             <li>
                <button
                    onClick={() => onPageChange(page)}
                    className={`w-full text-left px-3 py-1.5 rounded-md transition-colors text-xs font-medium ${
                        isActive
                            ? 'text-white'
                            : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                    }`}
                >
                    {page}
                </button>
            </li>
        );
    };

    const sidebarContent = (
        <div className="flex flex-col h-full">
            <div className="p-4 flex justify-between items-center border-b border-gray-700">
                 <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                    AV Assistant
                </h1>
                <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white"><CloseIcon /></button>
            </div>
            <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
                {/* Dashboard */}
                <ul className="space-y-1">
                    <NavGroup
                        title="Dashboard"
                        icon={<DashboardIcon />}
                        isOpen={isDashboardOpen}
                        onToggle={() => setIsDashboardOpen(!isDashboardOpen)}
                        pages={dashboardPages}
                        activeSubPages={[activePage]}
                    />
                </ul>

                {/* Creation Suite */}
                <div>
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Creation Suite</h3>
                    <ul className="mt-2 space-y-1">
                        <NavItem page="Hashtag Manager" icon={<HashIcon />} />
                        <NavGroup
                            title="Content Creation"
                            icon={<PenIcon />}
                            isOpen={isContentOpen}
                            onToggle={() => setIsContentOpen(!isContentOpen)}
                            pages={contentCreationPages}
                            activeSubPages={[activePage]}
                        />
                         <NavGroup
                            title="Image Studio"
                            icon={<ImageIcon />}
                            isOpen={isImageOpen}
                            onToggle={() => setIsImageOpen(!isImageOpen)}
                            pages={imageStudioPages}
                            activeSubPages={[activePage]}
                        />
                        <NavGroup
                            title="Advanced Tools"
                            icon={<BrainIcon />}
                            isOpen={isAdvancedOpen}
                            onToggle={() => setIsAdvancedOpen(!isAdvancedOpen)}
                            pages={advancedToolsPages}
                            activeSubPages={[activePage]}
                        />
                         <NavItem page="AI Website" icon={<GlobeIcon />} />
                    </ul>
                </div>

                {/* Personas */}
                <div>
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Personas</h3>
                    <ul className="mt-2 space-y-1">
                        <NavGroup
                            title="Persona Templates"
                            icon={<TemplateIcon />}
                            isOpen={isPersonaOpen}
                            onToggle={() => setIsPersonaOpen(!isPersonaOpen)}
                            pages={personaPages}
                            activeSubPages={[activePage]}
                        />
                    </ul>
                </div>

                {/* Gallery */}
                <div>
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gallery</h3>
                    <ul className="mt-2 space-y-1">
                        <NavGroup
                            title="Content Gallery"
                            icon={<GalleryIcon />}
                            isOpen={isGalleryOpen}
                            onToggle={() => setIsGalleryOpen(!isGalleryOpen)}
                            pages={galleryPages}
                            activeSubPages={[activePage]}
                        />
                    </ul>
                </div>

                {/* Account */}
                <div>
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</h3>
                    <ul className="mt-2 space-y-1">
                        <NavGroup
                            title="Account Settings"
                            icon={<AccountIcon />}
                            isOpen={isAccountOpen}
                            onToggle={() => setIsAccountOpen(!isAccountOpen)}
                            pages={accountPages}
                            activeSubPages={[activePage]}
                        />
                    </ul>
                </div>

            </nav>
        </div>
    );

    return (
        <>
            {/* Mobile Sidebar */}
            <div className={`fixed inset-0 z-40 md:hidden transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                 <div className="fixed inset-0 bg-black/60" onClick={onClose}></div>
                 <div className="relative w-72 h-full bg-gray-800 border-r border-gray-700">
                    {sidebarContent}
                 </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:block w-64 h-screen sticky top-0 bg-gray-800 border-r border-gray-700">
                {sidebarContent}
            </div>
        </>
    );
};