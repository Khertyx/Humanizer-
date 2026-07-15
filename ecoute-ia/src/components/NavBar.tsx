import { NavLink } from "react-router-dom";

const ITEMS = [
  { to: "/chat", label: "Chat", icon: "💬" },
  { to: "/journal", label: "Journal", icon: "📈" },
  { to: "/exercices", label: "Exercices", icon: "🌿" },
  { to: "/annuaire", label: "Annuaire", icon: "📍" },
  { to: "/parametres", label: "Réglages", icon: "⚙️" },
];

export function NavBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-slate-200 bg-white/95 py-1.5 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center rounded-lg px-3 py-1 text-xs ${
              isActive ? "text-brand-600 dark:text-brand-300" : "text-slate-400"
            }`
          }
        >
          <span className="text-lg leading-none">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
