/**
 * Handles the deferred saving for Edits and Flows.
 * SEQUENTIAL EXECUTION to prevent DB Deadlocks from Triggers.
 */
export const executeDeferredUpdates = async (
  pendingFlows,          
  editedProjections,     
  actions                
) => {
  const flowResults = [];
  const updateResults = [];

  // 1. Save Pending Flows one by one
  for (const flow of pendingFlows) {
    const res = await actions.createFlow(flow.investmentId, flow.scenarioId, flow.data);
    flowResults.push(res);
  }

  // 2. Save Projection Edits one by one
  // Converting Object to Array and iterating sequentially
  const edits = Object.entries(editedProjections);
  for (const [id, payload] of edits) {
    const res = await actions.updateProjection(id, payload);
    updateResults.push(res);
  }

  return { flowResults, updateResults };
};