import NavBar from "@/components/nav-bar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <NavBar />
      <h1>Dashboard</h1>
      {children}
    </div>
  );
}
