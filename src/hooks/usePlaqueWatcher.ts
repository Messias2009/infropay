import { useEffect, useRef } from "react";
import { LEVELS, levelFor, type Level } from "@/lib/legends.functions";
import { showPlaqueUnlockToast } from "@/components/notifications/PlaqueUnlockToast";

const STORAGE_KEY = "infropay_last_unlocked_plaque_level";

/**
 * Hook para monitorar quando o produtor desbloqueia uma nova placa de premiação.
 * Compara o nível atual de faturamento com o último nível registrado e dispara
 * a notificação comemorativa quando um novo marco é superado.
 */
export function usePlaqueWatcher(currentRevenueCents: number | undefined) {
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || currentRevenueCents === undefined) return;

    // Apenas avalia se o faturamento atingiu ao menos a primeira placa (100.000 Kz = 100_000_00 cêntimos)
    const currentLevel = levelFor(currentRevenueCents);
    const hasAnyUnlocked = currentRevenueCents >= LEVELS[0].min_cents;

    if (!hasAnyUnlocked) {
      return;
    }

    const lastUnlockedKey = localStorage.getItem(STORAGE_KEY);

    // Se é a primeira vez que deteta ou se o nível atual é superior ao anterior registrado
    if (!lastUnlockedKey) {
      // Guarda o nível atual sem spammar se o utilizador já tinha o marco no carregamento inicial,
      // mas se estivermos na página de conquistas ou dashboard e for novo, disparamos.
      localStorage.setItem(STORAGE_KEY, currentLevel.key);
      if (!hasCheckedRef.current) {
        hasCheckedRef.current = true;
        // Se acabou de atingir, podemos celebrar
        showPlaqueUnlockToast(currentLevel);
      }
      return;
    }

    // Verifica se subiu de patamar
    const lastLevelIndex = LEVELS.findIndex((l) => l.key === lastUnlockedKey);
    const currentLevelIndex = LEVELS.findIndex((l) => l.key === currentLevel.key);

    if (currentLevelIndex > lastLevelIndex) {
      localStorage.setItem(STORAGE_KEY, currentLevel.key);
      showPlaqueUnlockToast(currentLevel);
    }
  }, [currentRevenueCents]);

  const previewPlaqueToast = (level: Level) => {
    showPlaqueUnlockToast(level, true);
  };

  return { previewPlaqueToast };
}
