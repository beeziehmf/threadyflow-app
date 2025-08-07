import React, { useContext } from "react";
import { createRoot } from "react-dom/client";

import { AppProvider, useAppContext } from './context/AppContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { NewThreadPage } from './pages/NewThreadPage.tsx';
import { IntegrationsPage } from './pages/IntegrationsPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { QueuePage } from './pages/QueuePage.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { NoWorkspaceView } from './pages/NoWorkspaceView.tsx';

// --- MAIN APP COMPONENT ---
const App = () => {
  const { activeView, currentAccountId, user } = useAppContext();

  console.log("App component rendered. User:", user);

  if (!user || !user.uid) {
    console.log("App: User not logged in, rendering AuthPage.");
    return <AuthPage />;
  }

  console.log("App: User logged in, rendering main content.");

  const renderContent = () => {
    const workspaceRequiredViews = ["dashboard", "new-thread"];
    if (workspaceRequiredViews.includes(activeView) && !currentAccountId) {
      return <NoWorkspaceView />;
    }

    switch (activeView) {
      case "dashboard":
        return <DashboardPage />;
      case "new-thread":
        return <NewThreadPage />;
      case "integrations":
        return <IntegrationsPage />;
      case "settings":
        return <SettingsPage />;
      case "queue":
        return <QueuePage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <Header />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
};

// --- RENDERER ---
const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);