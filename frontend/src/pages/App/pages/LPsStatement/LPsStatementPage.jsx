// src/pages/App/pages/LPsStatement/LPsStatementPage.jsx
import React, { useState } from "react";

// main UI (inside components)
import LPsStatement from "./components/LPsStatement.jsx";

// modals/drawers (also inside components)
import AddTransferModal from "./components/AddTransferModal.jsx";
import AddPeriodModal from "./components/AddPeriodModal.jsx";
import NewLPDrawer from "./components/NewLPDrawer.jsx";
import LPDetailsDrawer from "./components/LPDetailsDrawer.jsx";

import "./LPsStatementPage.css";

export default function LPsStatementPage() {
  const [selectedLP, setSelectedLP] = useState(null);

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isNewLpOpen, setIsNewLpOpen] = useState(false);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleSelectLP = (lp) => {
    setSelectedLP(lp);
    setIsDetailsOpen(true);
  };

  return (
    <>
      <LPsStatement
        onOpenTransfer={() => setIsTransferOpen(true)}
        onOpenNewLp={() => setIsNewLpOpen(true)}
        onOpenPeriod={() => setIsPeriodOpen(true)}
        onSelectLP={handleSelectLP}
      />

      <AddTransferModal
        open={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        lp={selectedLP}
      />

      <AddPeriodModal
        open={isPeriodOpen}
        onClose={() => setIsPeriodOpen(false)}
      />

      <NewLPDrawer
        open={isNewLpOpen}
        onClose={() => setIsNewLpOpen(false)}
      />

      <LPDetailsDrawer
  lp={selectedLP}
  open={!!selectedLP}
  onClose={() => setSelectedLP(null)}
/>

    </>
  );
}
