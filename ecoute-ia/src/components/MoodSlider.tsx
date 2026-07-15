const MOODS = ["😞", "😕", "😐", "🙂", "😄"];

export function MoodSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex justify-between gap-2">
      {MOODS.map((emoji, i) => {
        const moodValue = i + 1;
        const selected = value === moodValue;
        return (
          <button
            key={moodValue}
            type="button"
            onClick={() => onChange(moodValue)}
            aria-label={`Humeur ${moodValue} sur 5`}
            className={`flex-1 rounded-xl py-3 text-2xl transition ${
              selected ? "bg-brand-500 scale-105" : "bg-white dark:bg-slate-800"
            }`}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}
