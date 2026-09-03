export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefbf3",
          100: "#d8f3e3",
          200: "#b3e8c9",
          300: "#7dd8a7",
          400: "#48c483",
          500: "#1f9d5c",
          600: "#15804a",
          700: "#13663d",
          800: "#135134",
          900: "#123f2b"
        }
      },
      boxShadow: {
        soft: "0 20px 45px -24px rgba(15, 23, 42, 0.28)"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      animation: {
        "fade-in": "fadeIn 0.35s ease-out",
        "slide-up": "slideUp 0.35s ease-out"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      }
    }
  },
  plugins: []
};
