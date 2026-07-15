import type { AppState } from "../types";

const STORAGE_KEY = "ecoute-ia:v1";

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Stockage indisponible (navigation privée, quota) : on continue en
    // mémoire sans bloquer l'utilisateur.
  }
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportStateAsFile(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ecoute-ia-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
