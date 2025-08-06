import React from 'react';
import { PuzzleIcon } from '../components/icons.tsx';
import { useAppContext } from '../context/AppContext.tsx';

export const NoWorkspaceView: React.FC = () => {
    const { setActiveView } = useAppContext();

    return (
        <div className="no-workspace-view card">
            <PuzzleIcon />
            <h2>No Workspace Selected</h2>
            <p className="card-description">
                Please connect an account or select a workspace from the sidebar to continue.
            </p>
            <button className="button" onClick={() => setActiveView('integrations')}>
                Connect an Account
            </button>
        </div>
    );
};