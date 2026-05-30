import { Suspense } from "react";
import { GameContent } from "@/components/game/GameContent";
import { GameLoadingScreen } from "@/components/game/GameLoadingScreen";

export default function GamePage() {
  return (
    <Suspense fallback={<GameLoadingScreen />}>
      <GameContent />
    </Suspense>
  );
}
