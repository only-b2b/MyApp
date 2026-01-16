import React, { createContext, useContext, useEffect, useReducer, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";

const LeadsContext = createContext(null);
const CACHE_KEY = "leads-cache-v1";

function reducer(state, action) {
  switch (action.type) {
    case "SET":
      return action.payload;
    case "ADD":
      return [action.payload, ...state];
    case "UPDATE":
      return state.map(l => (l.id === action.payload.id ? { ...l, ...action.payload } : l));
    default:
      return state;
  }
}

export function LeadsProvider({ children }) {
  const [leads, dispatch] = useReducer(reducer, []);

  // 1) Load cache immediately on mount (for instant UI)
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw) dispatch({ type: "SET", payload: JSON.parse(raw) });
      } catch {}
    })();
  }, []);

  // 2) Then fetch from API and replace + refresh cache
  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/leads`);
      const data = await res.json();
      dispatch({ type: "SET", payload: data });
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      console.log("fetchLeads error", e);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const addLead = async (leadInput) => {
    try {
      const res = await fetch(`${API_BASE_URL}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadInput),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "CREATE_FAILED");
      }
      const created = await res.json();
      dispatch({ type: "ADD", payload: created });
      // update cache
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        arr.unshift(created);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(arr));
      } catch {}
      return created;
    } catch (e) {
      console.log("addLead error", e);
      throw e;
    }
  };

  const updateLead = async (id, patch) => {
    try {
      const res = await fetch(`${API_BASE_URL}/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("UPDATE_FAILED");
      const updated = await res.json();
      dispatch({ type: "UPDATE", payload: updated });
      // update cache
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        const idx = arr.findIndex(x => x.id === updated.id);
        if (idx >= 0) arr[idx] = { ...arr[idx], ...updated };
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(arr));
      } catch {}
      return updated;
    } catch (e) {
      console.log("updateLead error", e);
      throw e;
    }
  };

  return (
    <LeadsContext.Provider value={{ leads, addLead, updateLead, refresh: fetchLeads }}>
      {children}
    </LeadsContext.Provider>
  );
}

export const useLeads = () => useContext(LeadsContext);
