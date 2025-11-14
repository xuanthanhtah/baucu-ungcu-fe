module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "kid-pink": "#FF7AB6",
        "kid-blue": "#7AD3FF",
        "kid-yellow": "#FFE66D",
        "kid-green": "#8BF5A6",
        "kid-purple": "#C79CFF",
        "kid-orange": "#FFB27A",
      },
      keyframes: {
        float: {
          "0%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
          "100%": { transform: "translateY(0px)" },
        },
        wiggle: {
          "0%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
          "100%": { transform: "rotate(-2deg)" },
        },
        "confetti-rotate": {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "100%": {
            transform: "translateY(200px) rotate(360deg)",
            opacity: "0",
          },
        },
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        "float-slow": "float 6s ease-in-out infinite",
        wiggle: "wiggle 1.2s ease-in-out infinite",
        "bounce-slow": "bounce 1.8s infinite",
        confetti: "confetti-rotate 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};
