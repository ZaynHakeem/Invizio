const environment = import.meta.env ?? {};
export const config = {
  apiUrl: environment.VITE_API_URL ?? "http://localhost:3000",
};
