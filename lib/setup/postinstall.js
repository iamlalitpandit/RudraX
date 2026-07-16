if (process.env.RUDRAX_SKIP_SETUP !== "1" && !process.env.CI) {
  console.log("RudraX installed. Run `rudrax setup` to configure providers and optional capabilities.");
}
