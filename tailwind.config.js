import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-heading)", ...fontFamily.sans],
        body: ["var(--font-body)", ...fontFamily.mono],
      },
      colors: {
        "fp-p": "var(--fp-color-primary)",
        "fp-s": "var(--fp-color-secondary)",
        "fp-a-00": "var(--fp-color-accent-00)",
        "fp-a-01": "var(--fp-color-accent-01)",
        "fp-a-02": "var(--fp-color-accent-02)",
        "fp-a-03": "var(--fp-color-accent-03)",
        "fp-dec-00": "var(--fp-color-decorative-00)",
        "fp-dec-01": "var(--fp-color-decorative-01)",
        "fp-bg-00": "var(--fp-color-background-00)",
        "fp-bg-01": "var(--fp-color-background-01)",
        "fp-bg-02": "var(--fp-color-background-02)",
        "fp-dang": "var(--fp-color-danger)",
      },
      borderRadius: {
        "fp-s": "var(--fp-radius-small)",
        "fp-l": "var(--fp-radius-large)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("@tailwindcss/container-queries")],
};
