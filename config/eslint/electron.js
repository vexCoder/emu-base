module.exports = {
  extends: [require.resolve("./node.js")],
  rules: {
    "import/no-extraneous-dependencies": "off",
    "import/no-unresolved": "error",
  },
};
