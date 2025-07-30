import { signOut } from "@hono/auth-js/react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { AppSidebar } from "@/web/components/app-sidebar";
import { UserAvatar } from "@/web/components/user-avatar";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Separator } from "@workspace/ui/components/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@workspace/ui/components/sidebar";

export const Route = createFileRoute("/dashboard")({
  pendingComponent: () => (
    <div className="p-4">
      <Alert>
        <AlertTitle>Loading</AlertTitle>
        <AlertDescription>
          <Loader2 className="animate-spin" />
        </AlertDescription>
      </Alert>
    </div>
  ),
  async beforeLoad({ context, location }) {
    const session = await context.session; // Wait for auth to be done loading
    if (session?.status !== "authenticated") {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const handleLogout = () => {
    // eslint-disable-next-line no-alert
    if (window.confirm("Are you sure you want to logout?")) {
      signOut();
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-end">
            <UserAvatar onLogout={handleLogout} />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4">
          <Outlet />
        </main>
        <footer className="border-t px-4 py-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Dashboard Interface</span>
            <span>Built with Shadcn UI</span>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>

  );
}
