import React from 'react';
import { HomeIcon, PlusCircleIcon, PuzzleIcon } from './icons.tsx';

interface SidebarProps {
    activeView: string;
    setActiveView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => (
  <aside className="sidebar">
    <div className="sidebar-header">ThreadFlow</div>
    <nav>
      <ul className="sidebar-nav">
        <li className="nav-item">
          <a href="#" className={activeView === 'dashboard' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveView('dashboard'); }}>
            <HomeIcon /> Dashboard
          </a>
        </li>
        <li className="nav-item">
          <a href="#" className={activeView === 'new-thread' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveView('new-thread'); }}>
            <PlusCircleIcon /> New Thread
          </a>
        </li>
        <li className="nav-item">
            <a href="#" className={activeView === 'integrations' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveView('integrations'); }}>
                <PuzzleIcon /> Integrations
            </a>
        </li>
      </ul>
    </nav>
  </aside>
);
