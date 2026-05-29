"use client";

import { GameProvider } from "@/context/GameContext";

export function AppProviders({ children }) {
  return <GameProvider>{children}</GameProvider>;
}
