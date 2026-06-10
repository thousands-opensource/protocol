/** @type {import('tailwindcss').Config} */
import { mtConfig } from "@material-tailwind/react";
module.exports = {
    content: [
        "./features/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "../../../node_modules/@material-tailwind/react/dist/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    100: "#232323",
                    200: "#383838",
                    300: "#6D6D6D",
                    400: "#1E1E1E",
                    500: "#E8E8E8",
                    600: "#A5A5A5",
                },
                secondary: {
                    100: "#FE7552",
                },
            },
            fontFamily: {
                sans: ["Poppins", "sans-serif"],
            },
            keyframes: {
                float: {
                    "0%": {
                        transform: "translateY(0) scale(var(--scale, 1))",
                        opacity: "0",
                    },
                    "10%": {
                        opacity: "1",
                    },
                    "100%": {
                        transform: "translateY(-200px) scale(var(--scale, 1))",
                        opacity: "0",
                    },
                },
            },
            animation: {
                float: "float var(--duration, 2000ms) ease-out forwards",
            },
        },
    },
    plugins: [mtConfig],
};
