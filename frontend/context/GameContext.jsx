"use client";

import { createContext, useContext, useReducer, useCallback } from "react";

const TOTAL_ROUNDS = 10;

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
  ageYears: 22,
  currentEvent: null,
  currentNarrative: null,
  roundHistory: [],
  advisorMessages: [],
  debriefData: null,
  lastRoundDebrief: null,
};

function gameReducer(state, action) {
  switch (action.type) {
    case "SET_PLAYER_NAME":
      return { ...state, playerName: action.payload };
    case "SET_CONFIDENCE":
      return { ...state, confidence: action.payload };
    case "SET_GOAL":
      return { ...state, goal: action.payload };
    case "HYDRATE_GAME_VIEW": {
      const {
        currentRound,
        metrics,
        event,
        narrative,
        scenarioId,
        ageYears,
        debrief,
      } = action.payload;
      return {
        ...state,
        ...(scenarioId ? { scenarioId } : {}),
        currentRound: currentRound ?? state.currentRound,
        metrics: metrics ?? state.metrics,
        currentEvent: event ?? null,
        currentNarrative: narrative ?? null,
        ageYears: ageYears ?? state.ageYears,
        selectedChoice: null,
        lastRoundDebrief: debrief ?? null,
      };
    }
    case "SELECT_CHOICE":
      return { ...state, selectedChoice: action.payload };
    case "RECORD_ROUND_SNAPSHOT": {
      const snapshot = action.payload;
      return {
        ...state,
        roundHistory: [...state.roundHistory, snapshot],
      };
    }
    case "ADD_ADVISOR_MESSAGE":
      return {
        ...state,
        advisorMessages: [
          ...state.advisorMessages,
          {
            round: state.currentRound,
            message: action.payload,
            timestamp: Date.now(),
          },
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

  const setPlayerName = useCallback(
    (name) => dispatch({ type: "SET_PLAYER_NAME", payload: name }),
    [],
  );
  const setConfidence = useCallback(
    (val) => dispatch({ type: "SET_CONFIDENCE", payload: val }),
    [],
  );
  const setGoal = useCallback(
    (goal) => dispatch({ type: "SET_GOAL", payload: goal }),
    [],
  );
  const hydrateGameView = useCallback(
    (payload) => dispatch({ type: "HYDRATE_GAME_VIEW", payload }),
    [],
  );
  const selectChoice = useCallback(
    (id) => dispatch({ type: "SELECT_CHOICE", payload: id }),
    [],
  );
  const recordRoundSnapshot = useCallback(
    (snapshot) =>
      dispatch({ type: "RECORD_ROUND_SNAPSHOT", payload: snapshot }),
    [],
  );
  const addAdvisorMessage = useCallback(
    (msg) => dispatch({ type: "ADD_ADVISOR_MESSAGE", payload: msg }),
    [],
  );
  const setDebriefData = useCallback(
    (data) => dispatch({ type: "SET_DEBRIEF_DATA", payload: data }),
    [],
  );
  const resetGame = useCallback(() => dispatch({ type: "RESET_GAME" }), []);

  return (
    <GameContext.Provider
      value={{
        ...state,
        totalRounds: TOTAL_ROUNDS,
        setPlayerName,
        setConfidence,
        setGoal,
        hydrateGameView,
        selectChoice,
        recordRoundSnapshot,
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
