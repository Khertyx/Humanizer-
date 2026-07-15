import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../state/store";
import { TOPIC_SUGGESTIONS } from "../lib/systemPrompts";
import { Avatar } from "../components/Avatar";

export function FirstConversation() {
  const navigate = useNavigate();
  const profile = useStore((s) => s.profile);
  const addMessage = useStore((s) => s.addMessage);
  const [answer, setAnswer] = useState("");
  const [showTopics, setShowTopics] = useState(false);

  if (!profile) {
    navigate("/onboarding");
    return null;
  }

  function start(topic: string) {
    addMessage({
      id: crypto.randomUUID(),
      role: "coach",
      text: `Bonjour ${profile!.pseudonym}, je suis ${profile!.coachName}. Content${
        profile!.coachGender === "femme" ? "e" : ""
      } de faire ta connaissance. Qu'est-ce qui t'amène aujourd'hui ?`,
      createdAt: new Date(Date.now() - 1000).toISOString(),
    });
    addMessage({
      id: crypto.randomUUID(),
      role: "user",
      text: topic,
      createdAt: new Date().toISOString(),
    });
    navigate("/chat");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <Avatar gender={profile.coachGender} size={80} />
        <p className="text-lg">
          Bonjour <strong>{profile.pseudonym}</strong>, je suis{" "}
          <strong>{profile.coachName}</strong>. Qu'est-ce qui t'amène
          aujourd'hui ?
        </p>
      </div>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Écris ce qui te vient, ou choisis un thème ci-dessous..."
        className="min-h-[100px] w-full rounded-xl border border-slate-300 p-3 text-sm dark:border-slate-600 dark:bg-slate-800"
      />

      <button
        onClick={() => (answer.trim() ? start(answer.trim()) : setShowTopics(true))}
        className="w-full rounded-xl bg-brand-500 py-3 font-medium text-white"
      >
        {answer.trim() ? "Envoyer" : "Je ne sais pas trop..."}
      </button>

      {showTopics && (
        <div>
          <p className="mb-2 text-sm text-slate-500">Ou choisis un thème :</p>
          <div className="flex flex-wrap gap-2">
            {TOPIC_SUGGESTIONS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => start(topic.label)}
                className="rounded-full bg-white px-4 py-2 text-sm shadow-sm dark:bg-slate-800"
              >
                {topic.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
