/**
 * Handles the deferred saving for Edits and Flows.
 * Creation is excluded as it is handled separately.
 */
export const executeDeferredUpdates = async (
  pendingFlows,          // Array of { investmentId, scenarioId, data }
  editedProjections,     // Object { projectionId: { payload } }
  actions                // { createFlow, updateProjection }
) => {
  // 1. Save Pending Flows (Investments/Divestments)
  const flowResults = await Promise.all(
    pendingFlows.map(flow => 
      actions.createFlow(flow.investmentId, flow.scenarioId, flow.data)
    )
  );

  // 2. Save Projection Edits (Duration/MOIC)
  const updateResults = await Promise.all(
    Object.entries(editedProjections).map(([id, payload]) => 
      actions.updateProjection(id, payload)
    )
  );

  return { flowResults, updateResults };
};