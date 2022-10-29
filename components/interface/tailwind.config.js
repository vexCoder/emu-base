const { pipe, map, reduce, keys } = require("ramda");
const plugin = require("tailwindcss/plugin");
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["src/**/*.tsx"],
  theme: {
    extend: {
      colors: ({ theme }) => {
        const colors = ['primary', 'secondary', 'text', 'contrastText', 'focus', 'highlight']

        const colorsPalette = pipe(
          map((color) => ({
            [color]: `rgb(var(--color-${color}))`,
            ...reduce((p, k) => {
              const value = theme('opacity')[k]
              return ({
                ...p,
                [`${color}/${k}`]: `rgba(var(--color-${color}), ${value})`,
              })
            }, {}, keys(theme('opacity'))),
          })),
          reduce((acc, curr) => ({ ...acc, ...curr }), {})
        )(colors)

        return colorsPalette
      },
      animation: {
        "mount-enter-fade": "fade-keyframes 1s ease-in-out",
      },
      keyframes: {
        "fade-keyframes": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
    boxShadow: ({ theme }) => {
      return {
        'gentle-fade': `rgba(${theme('colors.focus')}, 0.2) 0px 7px 29px 0px`,
        outlined:
          `rgb(0 0 0 / 0.16) 0px 1px 4px, rgb(0 0 0) 0px 0px 0px 3px`,
      }
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
};
