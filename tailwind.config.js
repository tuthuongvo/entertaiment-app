/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.html",
    "./public/*.html",
    "./src/*.{html,css,js,ts,jsx,tsx}",
    "./src/**/*.{html,css,js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      sm: "420px",
      md: "960px",
      lg: "1440px",
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        bai: ["Bai Jamjuree", "sans-serif"],
      },
      backgroundImage: {
        mainComment: "linear-gradient(180deg, #77051F 0%, #432617 100%)",
        herofilm: "linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, #010101 100%)",
        herofilmdetail:
          "linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, #010101 60%)",
      },
      colors: {
        mainBlack: "#010101",
        primary: "#D11030",
        grey: {
          DEFAULT: "#292929",
          light: "#B2B2B2",
          50: "#595959",
          80: "#EDEDED",
        },
        blue: {
          DEFAULT: "#6B87F9",
        },
      },
      gridTemplateColumns: {
        user: "repeat(auto-fit, minmax(76px, 1fr))",
      },
      container: {
        center: true, // Centers the container by default
        padding: "16px", // Adds padding to the container
        screens: {
          sm: "420px", // Mobile Small
          md: "768px", // Tablet
          lg: "1024px", // Laptop
          xl: "1280px", // Desktop
          "2xl": "1536px", // Large Desktop
        },
      },
    },
  },
  plugins: [
    require("tailwind-scrollbar")({ nocompatible: true }),
    function ({ addUtilities }) {
      addUtilities({
        ".no-drag": {
          "-webkit-user-drag": "none",
          "user-drag": "none",
          "user-select": "none",
        },
        ".no-scrollbar": {
          "-ms-overflow-style": "none", // IE and Edge
          "scrollbar-width": "none", // Firefox
        },
        ".no-scrollbar::-webkit-scrollbar": {
          display: "none", // Safari and Chrome
        },
      });
    },
  ],
};
