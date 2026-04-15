import { useState, useCallback } from 'react';
import useApi from "../../../../hooks/api/useApi";

const toSafeArray = (value) => (Array.isArray(value) ? value : []);

export const usePortfolio = (fundId) => {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [investments, setInvestments] = useState([]);
  const [flowsByInvestment, setFlowsByInvestment] = useState({});
  const [fairValuesByInvestment, setFairValuesByInvestment] = useState({});

  const fetchInvestments = useCallback(async (scenarioId = null) => {
    setLoading(true);
    try {
      const endpoint = scenarioId
        ? `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/`
        : `/api/funds/${fundId}/portfolio-investments/`;
        
      const raw = toSafeArray(await api.get(endpoint));
      const normalized = raw.map((inv) => {
        let tFlows = toSafeArray(inv.transaction_flows);
        let fvFlows = toSafeArray(inv.fair_value_flows);

        if (scenarioId === null) {
          tFlows = tFlows.filter(flow => flow.scenario_id === null);
          fvFlows = fvFlows; 
        }

        return {
          ...inv,
          transaction_flows: tFlows,
          fair_value_flows: fvFlows,
        };
      });

      const flowsMap = {};
      const fairValuesMap = {};
      
      normalized.forEach((inv) => {
        const id = Number(inv?.investment_id ?? inv?.id ?? inv?.investmentId);
        if (!Number.isFinite(id)) return;
        flowsMap[id] = inv.transaction_flows;
        fairValuesMap[id] = inv.fair_value_flows;
      });

      setInvestments(normalized);
      setFlowsByInvestment(flowsMap);
      setFairValuesByInvestment(fairValuesMap);
    } catch (err) {
      console.error("Failed to fetch investments", err.message);
    } finally {
      setLoading(false);
    }
  }, [fundId, api]);
  // --- rest of the hook unchanged ---

  const createInvestment = async (scenarioId = null, payload) => {
    const endpoint = scenarioId
      ? `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/`
      : `/api/funds/${fundId}/portfolio-investments/`;
    try {
      const data = await api.post(endpoint, { ...payload, scenario_id: scenarioId });
      fetchInvestments(scenarioId);
      return data;
    } catch (err) {
      console.error("Investment creation failed", err.message);
      throw err;
    }
  };

  const updateInvestment = async (scenarioId = null, investmentId, payload) => {
    const endpoint = scenarioId
      ? `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/`
      : `/api/funds/${fundId}/portfolio-investments/${investmentId}/`;
    try {
      console.log("Updating investment with payload:", payload);
      console.log("Endpoint for update:", endpoint);
      const data = await api.patch(endpoint, payload);
      fetchInvestments(scenarioId);
      return data;
    } catch (err) {
      console.error("Investment update failed", err.message);
      throw err;
    }
  };

  const deleteInvestment = async (scenarioId = null, investmentId) => {
    const endpoint = scenarioId
      ? `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/`
      : `/api/funds/${fundId}/portfolio-investments/${investmentId}/`;
    try {
      await api.delete(endpoint);
      fetchInvestments(scenarioId);
    } catch (err) {
      console.error("Investment deletion failed", err.message);
      throw err;
    }
  };

  const createFlow = async (investmentId, scenarioId = null, payload) => {
    const endpoint = scenarioId
      ? `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/flows/`
      : `/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/`;
    try {
      const data = await api.post(endpoint, payload);
      fetchInvestments(scenarioId);
      return data;
    } catch (err) {
      console.error("Flow creation failed", err.message);
      throw err;
    }
  };

  const deleteFlow = async (investmentId, scenarioId = null, flowId) => {
    const endpoint = scenarioId
      ? `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/flows/${flowId}/`
      : `/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/${flowId}/`;
    try {
      await api.delete(endpoint);
      fetchInvestments(scenarioId);
    } catch (err) {
      console.error("Flow deletion failed", err.message);
    }
  };

  return {
    investments,
    flowsByInvestment,
    fairValuesByInvestment,
    loading,
    fetchInvestments,
    createInvestment,
    updateInvestment,
    deleteInvestment,
    createFlow,
    deleteFlow,
  };
};