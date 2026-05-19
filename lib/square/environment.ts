export type SquareEnvironment = "sandbox" | "production";

export function getSquareEnvironment(): SquareEnvironment {
  return process.env.SQUARE_ENVIRONMENT === "production" ? "production" : "sandbox";
}

export function getSquareEnvironmentLabel(environment: SquareEnvironment) {
  return environment === "production" ? "Production" : "Sandbox";
}

export function getSquareApiBaseUrl() {
  return getSquareEnvironment() === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}
