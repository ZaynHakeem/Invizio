
import { useState } from "react";
import { useAuth } from "react-oidc-context";

const API_URL =
  "https://hgk5p8pebb.execute-api.us-east-2.amazonaws.com";

export function CognitoLoginButton() {
  const auth = useAuth();
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function testProtectedApi() {
    const token = auth.user?.access_token;

    if (!token) {
      setResult("No Cognito access token available.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/items`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      setResult(JSON.stringify({
        operation: "GET inventory",
        status: response.status,
        data,
      }, null, 2));
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function testCreateItem() {
    const token = auth.user?.access_token;

    if (!token) {
      setResult("No Cognito access token available.");
      return;
    }

    setLoading(true);

    const newItem = {
      sku: `POST-${Date.now()}`,
      name: "AWS Created Test Item",
      category: "Testing",
      quantity: 10,
      price: 49.99,
      description: "Created through the authenticated AWS POST API",
      minStockLevel: 2,
    };

    try {
      const response = await fetch(`${API_URL}/api/items`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newItem),
      });

      const data = await response.json();

      setResult(JSON.stringify({
        operation: "POST create inventory item",
        status: response.status,
        submittedItem: newItem,
        data,
      }, null, 2));
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Request failed");
    } finally {
      setLoading(false);
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
          disabled={loading}
          onClick={() => void testProtectedApi()}
        >
          Test protected AWS API (GET)
        </button>

        <button
          type="button"
          className="button secondary full"
          disabled={loading}
          onClick={() => void testCreateItem()}
        >
          Create test inventory item (POST)
        </button>

        {loading && <p>Talking to AWS...</p>}

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
