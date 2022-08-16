module.exports = {
    extends: [
      "airbnb", 
      "airbnb-typescript", 
      "airbnb/hooks",
      "prettier",
      require.resolve("./parser.js"),
      require.resolve("./base.js")
    ],
    rules: {
      "react/function-component-definition": ["error", {"namedComponents": "arrow-function"}],
      "arrow-body-style": "off"
    }
  };
  