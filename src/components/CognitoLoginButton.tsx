
import { useState } from "react";
import { useAuth } from "react-oidc-context";

const API_URL =
  "https://hgk5p8pebb.execute-api.us-east-2.amazonaws.com";

export function CognitoLoginButton() {
  const auth = useAuth();
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdItemId, setCreatedItemId] = useState("");

  async function makeRequest(
    operation: string,
    url: string,
    method = "GET",
    body?: object
  ) {
    const token = auth.user?.access_token;

    if (!token) {
      setResult("No Cognito access token available.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      const data = await response.json();

      if (operation === "POST create inventory item" && response.ok) {
        setCreatedItemId(data.item.id);
      }

      if (operation === "DELETE inventory item" && response.ok) {
        setCreatedItemId("");
      }

      setResult(JSON.stringify({
        operation,
        status: response.status,
        data,
      }, null, 2));
    } catch (error) {
      setResult(
        error instanceof Error ? error.message : "Request failed"
      );
    } finally {
      setLoading(false);
    }
  }

  function testProtectedApi() {
    return makeRequest(
      "GET inventory",
      `${API_URL}/api/items`
    );
  }

  function testCreateItem() {
    const newItem = {
      sku: `POST-${Date.now()}`,
      name: "AWS Created Test Item",
      category: "Testing",
      quantity: 10,
      price: 49.99,
      description: "Created through the authenticated AWS API",
      minStockLevel: 2,
    };

    return makeRequest(
      "POST create inventory item",
      `${API_URL}/api/items`,
      "POST",
      newItem
    );
  }

  function testUpdateItem() {
    return makeRequest(
      "PUT update inventory item",
      `${API_URL}/api/items/${encodeURIComponent(createdItemId)}`,
      "PUT",
      {
        quantity: 15,
        price: 59.99,
      }
    );
  }

  function testDeleteItem() {
    return makeRequest(
      "DELETE inventory item",
      `${API_URL}/api/items/${encodeURIComponent(createdItemId)}`,
      "DELETE"
    );
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
          Test GET inventory
        </button>

        <button
          type="button"
          className="button secondary full"
          disabled={loading}
          onClick={() => void testCreateItem()}
        >
          Create test item (POST)
        </button>

        <button
          type="button"
          className="button secondary full"
          disabled={loading || !createdItemId}
          onClick={() => void testUpdateItem()}
        >
          Update test item (PUT)
        </button>

        <button
          type="button"
          className="button secondary full"
          disabled={loading || !createdItemId}
          onClick={() => void testDeleteItem()}
        >
          Delete test item (DELETE)
        </button>

        {createdItemId && (
          <p>Test item ID: {createdItemId}</p>
        )}

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
