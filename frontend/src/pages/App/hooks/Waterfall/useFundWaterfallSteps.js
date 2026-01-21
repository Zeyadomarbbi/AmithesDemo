// frontend/src/hooks/Waterfall/useFundWaterfallSteps.js
import { useState, useCallback } from "react";

const BASE_URL = "http://127.0.0.1:8000/api";

export function useFundWaterfallSteps() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. GET Definitions: Fetch static step types (Nominal, Hurdle, etc.)
  const fetchDefinitions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/waterfall-definitions/`);
      if (!response.ok) throw new Error("Failed to fetch waterfall definitions");
      return await response.json();
    } catch (err) {
      console.error(err);
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. GET Steps: Fetch existing configuration for a specific fund
  const fetchFundSteps = useCallback(async (fundId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/funds/${fundId}/waterfall-steps/`);
      if (!response.ok) throw new Error("Failed to fetch fund waterfall steps");
      return await response.json();
    } catch (err) {
      console.error(err);
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 3. POST: Create a new step with nested envelopes/rules
  const createStep = async (fundId, stepData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/funds/${fundId}/waterfall-steps/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stepData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(JSON.stringify(err));
      }
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 4. PUT: Update an existing step (including nested envelopes/rules)
  const updateStep = async (fundId, stepId, stepData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/funds/${fundId}/waterfall-steps/${stepId}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stepData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(JSON.stringify(err));
      }
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 5. DELETE: Remove a step configuration
  const deleteStep = async (fundId, stepId) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/funds/${fundId}/waterfall-steps/${stepId}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete step");
      }
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchDefinitions,
    fetchFundSteps,
    createStep,
    updateStep,
    deleteStep,
    isLoading,
    error,
  };
}