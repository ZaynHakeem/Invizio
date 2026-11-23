
import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "react-oidc-context";
import App from "./src/App";
import "./index.css";

const cognitoAuthConfig = {
  authority:
    "https://cognito-idp.us-east-2.amazonaws.com/us-east-2_1okk3Cgme",

  client_id: "33r1l3phoajvilamb6uqggmhu4",

  redirect_uri:
    "https://aws-experiment.d2z9esd8aw48vi.amplifyapp.com/",

  response_type: "code",

  scope: "openid email",
};

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
