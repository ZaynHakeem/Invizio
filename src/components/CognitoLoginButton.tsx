
import { useAuth } from "react-oidc-context";

export function CognitoLoginButton() {
  const auth = useAuth();

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
