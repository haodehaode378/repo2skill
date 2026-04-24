export function readConfig() {
  return {
    apiUrl: process.env.API_URL,
    secret: process.env.SECRET_TOKEN
  };
}
