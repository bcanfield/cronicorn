import { Loader2 } from "lucide-react";

export default function RoutePending() {
  return (
    <div className="flex justify-center items-center w-full h-full">
      <Loader2 className="animate-spin" />
    </div>
  );
}
