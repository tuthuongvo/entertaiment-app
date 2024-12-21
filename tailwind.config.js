/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./src/**/*.{css,js,ts,jsx,tsx}"],
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
      colors: {
        mainBlack: "#010101", // Define your custom color with a name
        primary: "#D11030",
        grey: "#292929",
      },
      container: {
        center: true, // Centers the container by default
        // padding: "2rem", // Adds padding to the container
        screens: {
          sm: "420px",
        },
      },
    },
  },
  plugins: [],
};
