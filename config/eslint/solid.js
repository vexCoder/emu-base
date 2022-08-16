module.exports = {
  extends: [
    "plugin:solid/typescript",
    "eslint:recommended",
    "prettier",
    require.resolve("./parser.js"),
    require.resolve("./base.js"),
  ],
  plugins: ["solid"],
  rules: {
    "solid/reactivity": "warn",
    "solid/no-destructure": "warn",
    "solid/jsx-no-undef": "error"
  }
};
