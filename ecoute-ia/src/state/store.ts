import { create } from "zustand";
import type { AppState, ChatMessage, MoodEntry, UserProfile, WinEntry } from "../types";
import { loadState, saveState, clearState } from "../lib/storage";

interface Store extends AppState {
  setProfile: (profile: UserProfile) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  addMessage: (message: ChatMessage) => void;
  addMoodEntry: (entry: MoodEntry) => void;
  addWin: (win: WinEntry) => void;
  closeTopic: (topic: string) => void;
  resetAll: () => void;
}

const persisted = loadState();

function persist(state: AppState) {
  saveState(state);
}

export const useStore = create<Store>((set, get) => ({
  profile: persisted?.profile ?? null,
  messages: persisted?.messages ?? [],
  moodEntries: persisted?.moodEntries ?? [],
  wins: persisted?.wins ?? [],

  setProfile: (profile) => {
    set({ profile });
    persist({ ...get(), profile });
  },

  updateProfile: (patch) => {
    const current = get().profile;
    if (!current) return;
    const profile = { ...current, ...patch };
    set({ profile });
    persist({ ...get(), profile });
  },

  addMessage: (message) => {
    const messages = [...get().messages, message];
    set({ messages });
    persist({ ...get(), messages });
  },

  addMoodEntry: (entry) => {
    const moodEntries = [...get().moodEntries, entry];
    set({ moodEntries });
    persist({ ...get(), moodEntries });
  },

  addWin: (win) => {
    const wins = [...get().wins, win];
    set({ wins });
    persist({ ...get(), wins });
  },

  closeTopic: (topic) => {
    const current = get().profile;
    if (!current) return;
    const profile = { ...current, closedTopics: [...current.closedTopics, topic] };
    set({ profile });
    persist({ ...get(), profile });
  },

  resetAll: () => {
    clearState();
    set({ profile: null, messages: [], moodEntries: [], wins: [] });
  },
}));
