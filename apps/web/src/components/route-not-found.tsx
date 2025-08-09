import { Link } from "@tanstack/react-router";

import AppLogo from "@/web/icon.svg?react";
import { buttonVariants } from "@workspace/ui/components/button";

function NotFoundComponent() {
  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto min-h-screen flex flex-col">

      <div className="flex flex-col flex-auto items-center justify-center space-y-4">
        <div className="max-w-sm w-full flex flex-col items-center text-center space-y-4 ">
          <Link
            to="/"
          >
            <AppLogo className="w-16 h-16" />
          </Link>

          <h1 className="text-3xl font-bold mb-2">Page not found</h1>
          <p className="text-muted-foreground">Sorry, we couldn't find the page you're looking for.</p>
          <Link
            to="/"
            className={buttonVariants({
              variant: "outline",
            })}
          >
            Go Back Home
          </Link>

        </div>
      </div>

    </div>
  );
}

export default NotFoundComponent;
