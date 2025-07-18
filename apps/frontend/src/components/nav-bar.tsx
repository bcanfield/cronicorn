import SignInOrOutButton from "./login-popup";

export default function NavBar() {
  return (
    <nav className="flex items-center justify-between p-4 bg-gray-800 text-white">
      <div className="text-lg font-bold">My App</div>
      <div className="flex gap-4">
        <a href="/" className="hover:underline">
          Home
        </a>
        <a href="/dashboard" className="hover:underline">
          Dashboard
        </a>
        <SignInOrOutButton />
      </div>
    </nav>
  );
}
