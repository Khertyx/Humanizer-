// Fines couches au-dessus des Web Speech APIs natives (STT + TTS).
// MVP volontairement basé sur les APIs navigateur : pas de backend requis,
// fonctionne offline pour la synthèse. Voir docs/DESIGN.md 1.2 pour la
// trajectoire V1 (voix différenciées de meilleure qualité).

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

type RecognitionResultHandler = (text: string, isFinal: boolean) => void;

export function startListening(onResult: RecognitionResultHandler, onEnd: () => void): (() => void) | null {
  if (!isSpeechRecognitionSupported()) return null;
  const SpeechRecognitionCtor: any =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognitionCtor();
  recognition.lang = "fr-FR";
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onresult = (event: any) => {
    const result = event.results[event.results.length - 1];
    onResult(result[0].transcript, result.isFinal);
  };
  recognition.onend = onEnd;
  recognition.onerror = onEnd;
  recognition.start();

  return () => recognition.stop();
}

export function speak(text: string, gender: "homme" | "femme"): void {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = 0.98;
  utterance.pitch = gender === "femme" ? 1.15 : 0.9;

  const voices = window.speechSynthesis.getVoices();
  const frenchVoices = voices.filter((v) => v.lang.startsWith("fr"));
  const preferred =
    frenchVoices.find((v) =>
      gender === "femme"
        ? /female|femme|amélie|audrey/i.test(v.name)
        : /male|homme|thomas|nicolas/i.test(v.name)
    ) || frenchVoices[0];
  if (preferred) utterance.voice = preferred;

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
}
