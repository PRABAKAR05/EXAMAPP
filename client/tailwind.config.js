/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1e3a8a", // Deep Blue
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#64748b", // Slate
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#10b981", // Emerald
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#ef4444", // Soft Red
          foreground: "#ffffff",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
    },
  },
  plugins: [],
};
