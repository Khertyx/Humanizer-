export type CoachGender = "homme" | "femme";

export interface TrustedContact {
  name: string;
  contact: string;
}

export interface UserProfile {
  fullName: string;
  birthDate: string;
  city: string;
  email: string;
  pseudonym: string;
  coachGender: CoachGender;
  coachName: string;
  trustedContact: TrustedContact | null;
  healthConsentAt: string | null;
  disclaimerAcceptedAt: string | null;
  onboardingComplete: boolean;
  closedTopics: string[];
}

export type ChatRole = "user" | "coach" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: string;
  crisisLevel?: CrisisLevel;
}

export type CrisisLevel = "vert" | "orange" | "rouge";

export interface MoodEntry {
  id: string;
  mood: number; // 1-5
  note: string;
  createdAt: string;
}

export interface WinEntry {
  id: string;
  text: string;
  createdAt: string;
}

export interface AppState {
  profile: UserProfile | null;
  messages: ChatMessage[];
  moodEntries: MoodEntry[];
  wins: WinEntry[];
}
