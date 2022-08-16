module.exports = {
    extends: [
      "airbnb-base", 
      "airbnb-typescript/base", 
      "prettier",
      require.resolve("./parser.js"),
      require.resolve("./base.js")
    ]
  };
  