// in: frontend/src/App.jsx

import React from 'react';

// Import global components
import SidePanel from './components/SidePanel';

// 1. Import your new page
import ScenariosPage from './pages/Scenario/ScenariosPage';

// Import the layout CSS
import './App.css';

function App() {
  return (
    <div className="app-layout">
      {/* SidePanel is permanent on the left */}
      <SidePanel />

      {/* Main content area on the right */}
      <main className="main-content">
        
        {/* 2. Place your page component here */}
        <ScenariosPage />

        {/*
          Later, a "Router" will go here to switch
          between <ScenariosPage />, <DashboardPage />, etc.
        */}
      </main>
    </div>
  );
}

export default App;