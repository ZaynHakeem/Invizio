const environment = import.meta.env ?? {};
export const config = {
  apiUrl: environment.VITE_API_URL ?? "http://localhost:3000",
  enableApiWorkspace: environment.VITE_ENABLE_API_WORKSPACE === "true",
};
