import React, { useState } from "react";
import DashboardTab from "./components/DashboardTab/DashboardTab";
import Deals from "./components/DealsTab/Deals";
import SetupTab from "./components/SetupTab/SetupTab";
import "./Dealflowpage.css";

const TABS = ["Dashboard", "Deals", "Setup"];

const DealflowPage = () => {
  const [activeTab, setActiveTab] = useState("Dashboard");

  return (
    <div className="df-page">

      <h1 className="df-title">Dealflow</h1>

      <div className="df-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`df-tab${activeTab === tab ? " active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Dashboard" && <DashboardTab />}
      {activeTab === "Deals" && <Deals />}
      {activeTab === "Setup" && <SetupTab />}

    </div>
  );
};

export default DealflowPage;
