import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useStore } from "./state/store";
import { NavBar } from "./components/NavBar";
import { Onboarding } from "./pages/Onboarding";
import { FirstConversation } from "./pages/FirstConversation";
import { Chat } from "./pages/Chat";
import { MoodJournal } from "./pages/MoodJournal";
import { Exercises } from "./pages/Exercises";
import { Settings } from "./pages/Settings";
import { Directory } from "./pages/Directory";

export default function App() {
  const profile = useStore((s) => s.profile);
  const location = useLocation();
  const showNav = profile?.onboardingComplete && location.pathname !== "/premier-echange";

  return (
    <div className="min-h-screen">
      <Routes>
        <Route
          path="/onboarding"
          element={profile?.onboardingComplete ? <Navigate to="/chat" replace /> : <Onboarding />}
        />
        <Route path="/premier-echange" element={<FirstConversation />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/journal" element={<MoodJournal />} />
        <Route path="/exercices" element={<Exercises />} />
        <Route path="/annuaire" element={<Directory />} />
        <Route path="/parametres" element={<Settings />} />
        <Route
          path="*"
          element={<Navigate to={profile?.onboardingComplete ? "/chat" : "/onboarding"} replace />}
        />
      </Routes>
      {showNav && <NavBar />}
    </div>
  );
}
