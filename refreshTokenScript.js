oauth2Client.on('tokens', (tokens) => {
  if (tokens.refresh_token) {
    // store the refresh_token in your Node Helper instance or in your module's config file.
    console.log(tokens.refresh_token);
  }
  console.log(tokens.access_token);
});
oauth2Client.setCredentials({
  refresh_token: "12341//01nBeTZlsXwHXCgYIARAAGAESNwF-L9IrQ9FU_k-BTVrtfp4Q0myKM7flsg0n7hN0Ur5ObCQZLUAeflIURdTWjbSU6aeoHwJPjrE"
});
