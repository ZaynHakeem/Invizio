
import { useState } from "react";
import { useAuth } from "react-oidc-context";

const API_URL =
  "https://hgk5p8pebb.execute-api.us-east-2.amazonaws.com";

export function CognitoLoginButton() {
  const auth = useAuth();
  const [result, setResult] = useState("");

  async function testProtectedApi() {
    const token = auth.user?.access_token;

    if (!token) {
      setResult("No Cognito access token available.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/items`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      setResult(
        JSON.stringify(
          {
            status: response.status,
            data,
          },
          null,
          2
        )
      );
    } catch (error) {
      setResult(
        error instanceof Error
          ? error.message
          : "Request failed"
      );
    }
  }

  if (auth.isLoading) {
    return <p>Checking Cognito session...</p>;
  }

  if (auth.error) {
    return <p>Authentication error: {auth.error.message}</p>;
  }

  if (auth.isAuthenticated) {
    return (
      <div>
        <p>
          Signed in with Cognito as{" "}
          {auth.user?.profile.email}
        </p>

        <button
          type="button"
          className="button secondary full"
          onClick={() => void testProtectedApi()}
        >
          Test protected AWS API
        </button>

        {result && <pre>{result}</pre>}

        <button
          type="button"
          onClick={() => void auth.removeUser()}
        >
          Clear local session
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="button secondary full"
      onClick={() => void auth.signinRedirect()}
    >
      Sign in with Amazon Cognito
    </button>
  );
}
