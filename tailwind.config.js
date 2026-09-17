/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./index.tsx", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--bg)",
        surface: "var(--paper)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        action: "var(--accent)",
        "on-action": "var(--on-accent)",
        warning: "var(--amber)",
        danger: "var(--red)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
