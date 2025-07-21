import { signIn, signOut, useSession } from "@hono/auth-js/react";
import { Link, useLocation } from "@tanstack/react-router";

export default function AppNavbar() {
  const location = useLocation();
  const session = useSession();
  return (
    <nav className="container">
      <ul>
        <li><strong>Tasks App</strong></li>
      </ul>
      <ul>
        {location.pathname !== "/" && (
          <li>
            <Link to="/">Home</Link>
          </li>
        )}
        {session.data?.user
          ? (
              <>
                <li className="user-avatar">
                  <img src={session.data.user.image!} />
                  <p>{session.data.user.name}</p>
                </li>
                <li>
                  <button
                    type="button"
                    className="outline contrast"
                    onClick={() => signOut()}
                  >
                    Sign Out
                  </button>
                </li>
              </>
            )
          : (
              <li>
                <button
                  type="button"
                  className="outline contrast"
                  onClick={() => signIn("github")}
                >
                  Sign In
                </button>
              </li>
            )}
      </ul>
    </nav>
  );
}
