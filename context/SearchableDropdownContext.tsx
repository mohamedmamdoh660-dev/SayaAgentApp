"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
} from "react";
import { DropdownItem } from "@/components/searchable-dropdown";

// Types
interface DropdownState {
  [key: string]: {
    items: DropdownItem[];
    loading: boolean;
    hasMore: boolean;
    page: number;
    searchTerm: string;
    lastFetchTime: number;
    totalCount: number;
    selectedItem: DropdownItem | null;
  };
}

interface DropdownAction {
  type:
    | "SET_LOADING"
    | "SET_ITEMS"
    | "ADD_ITEMS"
    | "SET_HAS_MORE"
    | "SET_PAGE"
    | "SET_SEARCH_TERM"
    | "SET_SELECTED_ITEM"
    | "CLEAR_CACHE"
    | "RESET_STATE"
    | "CLEAR_LOCATION"
    | "CLEAR_ALL_SELECTIONS";
  table: string;
  location?: string;
  payload?: any;
}

interface DropdownContextType {
  state: DropdownState;
  dispatch: React.Dispatch<DropdownAction>;
  getCachedData: (
    table: string,
    location?: string
  ) => DropdownState[string] | null;
  setCachedData: (
    table: string,
    data: Partial<DropdownState[string]>,
    location?: string
  ) => void;
  clearCache: (table?: string, location?: string) => void;
  clearLocationCache: (location: string) => void;
  clearAllSelections: (location: string) => void;
  isDataStale: (table: string, maxAge?: number, location?: string) => boolean;
}

// Initial state
const initialState: DropdownState = {};

// Helper function to generate state key
const getStateKey = (table: string, location?: string) => {
  return location ? `${table}_${location}` : table;
};

// Reducer
const dropdownReducer = (
  state: DropdownState,
  action: DropdownAction
): DropdownState => {
  const { type, table, location, payload } = action;
  const stateKey = getStateKey(table, location);

  // Create a copy of state to avoid mutations
  const newState = { ...state };

  if (!newState[stateKey]) {
    newState[stateKey] = {
      items: [],
      loading: false,
      hasMore: true,
      page: 0,
      searchTerm: "",
      lastFetchTime: 0,
      totalCount: 0,
      selectedItem: null,
    };
  }

  switch (type) {
    case "SET_LOADING":
      return {
        ...newState,
        [stateKey]: {
          ...newState[stateKey],
          loading: payload,
        },
      };

    case "SET_ITEMS":
      return {
        ...newState,
        [stateKey]: {
          ...newState[stateKey],
          items: payload.items || [],
          totalCount: payload.totalCount || 0,
          lastFetchTime: Date.now(),
        },
      };

    case "ADD_ITEMS":
      return {
        ...newState,
        [stateKey]: {
          ...newState[stateKey],
          items: [...newState[stateKey].items, ...payload.items],
          lastFetchTime: Date.now(),
        },
      };

    case "SET_HAS_MORE":
      return {
        ...newState,
        [stateKey]: {
          ...newState[stateKey],
          hasMore: payload,
        },
      };

    case "SET_PAGE":
      return {
        ...newState,
        [stateKey]: {
          ...newState[stateKey],
          page: payload,
        },
      };

    case "SET_SEARCH_TERM":
      return {
        ...newState,
        [stateKey]: {
          ...newState[stateKey],
          searchTerm: payload,
        },
      };

    case "SET_SELECTED_ITEM":
      return {
        ...newState,
        [stateKey]: {
          ...newState[stateKey],
          selectedItem: payload,
        },
      };

    case "CLEAR_CACHE":
      if (payload) {
        // Clear specific table cache
        const clearedState = { ...newState };
        delete clearedState[payload];
        return clearedState;
      } else {
        // Clear all cache
        return {};
      }

    case "CLEAR_LOCATION":
      // Clear all tables for a specific location
      const locationClearedState = { ...newState };
      Object.keys(locationClearedState).forEach((key) => {
        if (key.endsWith(`_${payload}`)) {
          delete locationClearedState[key];
        }
      });
      return locationClearedState;

    case "CLEAR_ALL_SELECTIONS":
      // Clear all selected items for a specific location
      const selectionsClearedState = { ...newState };
      Object.keys(selectionsClearedState).forEach((key) => {
        if (key.endsWith(`_${payload}`)) {
          selectionsClearedState[key] = {
            ...selectionsClearedState[key],
            selectedItem: null,
          };
        }
      });
      return selectionsClearedState;

    case "RESET_STATE":
      return {
        ...newState,
        [stateKey]: {
          items: [],
          loading: false,
          hasMore: true,
          page: 0,
          searchTerm: "",
          lastFetchTime: 0,
          totalCount: 0,
          selectedItem: null,
        },
      };

    default:
      return newState;
  }
};

// Context
const SearchableDropdownContext = createContext<
  DropdownContextType | undefined
>(undefined);

// Provider component
export function SearchableDropdownProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(dropdownReducer, initialState);

  // Get cached data for a specific table
  const getCachedData = useCallback(
    (table: string, location?: string) => {
      const stateKey = getStateKey(table, location);
      return state[stateKey] || null;
    },
    [state]
  );

  // Set cached data for a specific table
  const setCachedData = useCallback(
    (
      table: string,
      data: Partial<DropdownState[string]>,
      location?: string
    ) => {
      // Instead of mutating state, dispatch individual updates
      Object.keys(data).forEach((key) => {
        if (data[key as keyof DropdownState[string]] !== undefined) {
          const value = data[key as keyof DropdownState[string]];
          if (key === "items") {
            dispatch({
              type: "SET_ITEMS",
              table,
              location,
              payload: {
                items: value as DropdownItem[],
                totalCount: data.totalCount,
              },
            });
          } else if (key === "loading") {
            dispatch({
              type: "SET_LOADING",
              table,
              location,
              payload: value as boolean,
            });
          } else if (key === "hasMore") {
            dispatch({
              type: "SET_HAS_MORE",
              table,
              location,
              payload: value as boolean,
            });
          } else if (key === "page") {
            dispatch({
              type: "SET_PAGE",
              table,
              location,
              payload: value as number,
            });
          } else if (key === "searchTerm") {
            dispatch({
              type: "SET_SEARCH_TERM",
              table,
              location,
              payload: value as string,
            });
          } else if (key === "selectedItem") {
            dispatch({
              type: "SET_SELECTED_ITEM",
              table,
              location,
              payload: value as DropdownItem | null,
            });
          }
        }
      });
    },
    [dispatch]
  );

  // Clear cache for specific table or all tables
  const clearCache = useCallback((table?: string, location?: string) => {
    dispatch({
      type: "CLEAR_CACHE",
      table: "",
      location,
      payload: table,
    });
  }, []);

  // Clear all cache for a specific location
  const clearLocationCache = useCallback((location: string) => {
    dispatch({
      type: "CLEAR_LOCATION",
      table: "",
      payload: location,
    });
  }, []);

  // Clear all selections for a specific location
  const clearAllSelections = useCallback((location: string) => {
    dispatch({
      type: "CLEAR_ALL_SELECTIONS",
      table: "",
      payload: location,
    });
  }, []);

  // Check if data is stale (older than maxAge milliseconds)
  const isDataStale = useCallback(
    (table: string, maxAge: number = 5 * 60 * 1000, location?: string) => {
      // 5 minutes default
      const stateKey = getStateKey(table, location);
      const tableData = state[stateKey];
      if (!tableData || !tableData.lastFetchTime) return true;
      return Date.now() - tableData.lastFetchTime > maxAge;
    },
    [state]
  );

  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
      getCachedData,
      setCachedData,
      clearCache,
      clearLocationCache,
      clearAllSelections,
      isDataStale,
    }),
    [
      state,
      dispatch,
      getCachedData,
      setCachedData,
      clearCache,
      clearLocationCache,
      clearAllSelections,
      isDataStale,
    ]
  );

  return (
    <SearchableDropdownContext.Provider value={contextValue}>
      {children}
    </SearchableDropdownContext.Provider>
  );
}

// Hook to use the context
export function useSearchableDropdown() {
  const context = useContext(SearchableDropdownContext);
  if (context === undefined) {
    throw new Error(
      "useSearchableDropdown must be used within a SearchableDropdownProvider"
    );
  }
  return context;
}

// Hook for specific table operations
export function useDropdownTable(table: string, location?: string) {
  const { state, dispatch, getCachedData, isDataStale } =
    useSearchableDropdown();

  const tableState = getCachedData(table, location) || {
    items: [],
    loading: false,
    hasMore: true,
    page: 0,
    searchTerm: "",
    lastFetchTime: 0,
    totalCount: 0,
    selectedItem: null,
  };

  const setLoading = useCallback(
    (loading: boolean) => {
      dispatch({ type: "SET_LOADING", table, location, payload: loading });
    },
    [dispatch, table, location]
  );

  const setItems = useCallback(
    (items: DropdownItem[], totalCount?: number) => {
      dispatch({
        type: "SET_ITEMS",
        table,
        location,
        payload: { items, totalCount },
      });
    },
    [dispatch, table, location]
  );

  const addItems = useCallback(
    (items: DropdownItem[]) => {
      dispatch({ type: "ADD_ITEMS", table, location, payload: { items } });
    },
    [dispatch, table, location]
  );

  const setHasMore = useCallback(
    (hasMore: boolean) => {
      dispatch({ type: "SET_HAS_MORE", table, location, payload: hasMore });
    },
    [dispatch, table, location]
  );

  const setPage = useCallback(
    (page: number) => {
      dispatch({ type: "SET_PAGE", table, location, payload: page });
    },
    [dispatch, table, location]
  );

  const setSearchTerm = useCallback(
    (searchTerm: string) => {
      dispatch({
        type: "SET_SEARCH_TERM",
        table,
        location,
        payload: searchTerm,
      });
    },
    [dispatch, table, location]
  );

  const setSelectedItem = useCallback(
    (selectedItem: DropdownItem | null) => {
      dispatch({
        type: "SET_SELECTED_ITEM",
        table,
        location,
        payload: selectedItem,
      });
    },
    [dispatch, table, location]
  );

  const resetState = useCallback(() => {
    dispatch({ type: "RESET_STATE", table, location });
  }, [dispatch, table, location]);

  return {
    ...tableState,
    setLoading,
    setItems,
    addItems,
    setHasMore,
    setPage,
    setSearchTerm,
    setSelectedItem,
    resetState,
    isDataStale: isDataStale(table, undefined, location),
  };
}

// Hook for clearing all selections in a location
export function useClearLocationSelections() {
  const { clearAllSelections } = useSearchableDropdown();

  return useCallback(
    (location: string) => {
      clearAllSelections(location);
    },
    [clearAllSelections]
  );
}
