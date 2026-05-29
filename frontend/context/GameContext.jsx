"use client";

import { createContext, useContext, useReducer, useCallback } from "react";
import { applyChoice, createNewGame } from "@/lib/sim";

const TOTAL_ROUNDS = 10;

function toUIMetrics(visibleMetrics, simState) {
  return {
    monthlyIncome: visibleMetrics.monthlyIncomeNet,
    monthlyExpenses: visibleMetrics.monthlyExpenses,
    savingsBalance: visibleMetrics.cash,
    totalDebt: visibleMetrics.totalDebt,
    creditScore: visibleMetrics.creditScore,
    retirementBalance: simState?.portfolio?.retirement ?? 0,
    debtToIncome: visibleMetrics.dti * 100,
    stressIndex: visibleMetrics.stress,
    netWorth: visibleMetrics.netWorth,
    inflationAnnual: visibleMetrics.inflationAnnual,
    recessionProbAnnual: visibleMetrics.recessionProbAnnual,
    investments: visibleMetrics.investments,
  };
}

const INITIAL_STATE = {
  playerName: "",
  confidence: 3,
  goal: "",
  scenarioId: "baseline",
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
    netWorth: 800,
    inflationAnnual: 0.025,
    recessionProbAnnual: 0.12,
    investments: 0,
  },
  simState: null,
  currentEvent: null,
  currentNarrative: null,
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
    case "START_SIMULATION": {
      const result = createNewGame({
        scenarioId: action.payload.scenarioId,
        seed: action.payload.seed,
      });
      return {
        ...state,
        scenarioId: action.payload.scenarioId,
        currentRound: 1,
        selectedChoice: null,
        simState: result.state,
        currentEvent: result.event,
        currentNarrative: result.narrative,
        metrics: toUIMetrics(result.metrics, result.state),
        roundHistory: [],
        debriefData: null,
      };
    }
    case "SELECT_CHOICE":
      return { ...state, selectedChoice: action.payload };
    case "APPLY_SIM_CHOICE": {
      if (!state.simState || !state.currentEvent) return state;
      const { choice } = action.payload;
      const result = applyChoice({ state: state.simState, choice });
      const snapshot = {
        round: state.currentRound,
        choice: choice,
        eventId: state.currentEvent.id,
        eventTitle: state.currentEvent.title,
        ageYears: Number(state.simState.ageYears.toFixed(1)),
        metricSnapshot: { ...state.metrics },
      };

      const nextRound = Math.min(state.currentRound + 1, TOTAL_ROUNDS + 1);
      return {
        ...state,
        metrics: toUIMetrics(result.metrics, result.state),
        roundHistory: [...state.roundHistory, snapshot],
        selectedChoice: null,
        currentRound: nextRound,
        simState: result.state,
        currentEvent: result.event,
        currentNarrative: result.narrative,
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
  const startSimulation = useCallback((scenarioId, seed) => {
    dispatch({ type: "START_SIMULATION", payload: { scenarioId, seed } });
  }, []);
  const selectChoice = useCallback((id) => dispatch({ type: "SELECT_CHOICE", payload: id }), []);
  const applySimChoice = useCallback((choice) =>
    dispatch({ type: "APPLY_SIM_CHOICE", payload: { choice } }), []);
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
        startSimulation,
        selectChoice,
        applySimChoice,
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
