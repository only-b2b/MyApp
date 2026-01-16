// app.config.js
export default ({ config }) => ({
  ...config,
  name: "ClientApp",
  slug: "ClientApp",
  extra: {
    // >>> PUT YOUR OLA API KEY HERE <<<
    OLA_API_KEY: "B83fEflQB86Gj9WD6F0GorrKDi9toFrGJlRZFrKb",
  },
});
