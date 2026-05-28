"use client";

import { createContext, useContext, useReducer, useCallback } from "react";

const INITIAL_STATE = {
  playerName: "",
  confidence: 3,
  goal: "",
  currentRound: 1,
  selectedChoice: null,
  metrics: {
    monthlyIncome: 3200,
    monthlyExpenses: 1800,
    savingsBalance: 800,
    totalDebt: 0,
    creditScore: 680,
    retirementBalance: 0,
    debtToIncome: 0,
    stressIndex: 15,
  },
  roundHistory: [],
  advisorMessages: [],
  debriefData: null,
};

function gameReducer(state, action) {
  switch (action.type) {
    case "SET_PLAYER_NAME":
      return { ...state, playerName: action.payload };
    case "SET_CONFIDENCE":
      return { ...state, confidence: action.payload };
    case "SET_GOAL":
      return { ...state, goal: action.payload };
    case "SELECT_CHOICE":
      return { ...state, selectedChoice: action.payload };
    case "CONFIRM_CHOICE": {
      const { choice, updatedMetrics } = action.payload;
      const snapshot = {
        round: state.currentRound,
        choice: choice,
        metricSnapshot: { ...state.metrics },
      };
      return {
        ...state,
        metrics: updatedMetrics,
        roundHistory: [...state.roundHistory, snapshot],
        selectedChoice: null,
        currentRound: state.currentRound + 1,
      };
    }
    case "ADD_ADVISOR_MESSAGE":
      return {
        ...state,
        advisorMessages: [
          ...state.advisorMessages,
          { round: state.currentRound, message: action.payload, timestamp: Date.now() },
        ],
      };
    case "SET_DEBRIEF_DATA":
      return { ...state, debriefData: action.payload };
    case "RESET_GAME":
      return {
        ...INITIAL_STATE,
        playerName: "",
        confidence: 3,
        goal: "",
      };
    default:
      return state;
  }
}

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);

  const setPlayerName = useCallback((name) => dispatch({ type: "SET_PLAYER_NAME", payload: name }), []);
  const setConfidence = useCallback((val) => dispatch({ type: "SET_CONFIDENCE", payload: val }), []);
  const setGoal = useCallback((goal) => dispatch({ type: "SET_GOAL", payload: goal }), []);
  const selectChoice = useCallback((id) => dispatch({ type: "SELECT_CHOICE", payload: id }), []);
  const confirmChoice = useCallback((choice, updatedMetrics) =>
    dispatch({ type: "CONFIRM_CHOICE", payload: { choice, updatedMetrics } }), []);
  const addAdvisorMessage = useCallback((msg) => dispatch({ type: "ADD_ADVISOR_MESSAGE", payload: msg }), []);
  const setDebriefData = useCallback((data) => dispatch({ type: "SET_DEBRIEF_DATA", payload: data }), []);
  const resetGame = useCallback(() => dispatch({ type: "RESET_GAME" }), []);

  return (
    <GameContext.Provider
      value={{
        ...state,
        setPlayerName,
        setConfidence,
        setGoal,
        selectChoice,
        confirmChoice,
        addAdvisorMessage,
        setDebriefData,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
}
