import { useEffect, useState } from "react";

import { Input } from "@workspace/ui/components/input";

export type SearchControlsProps = {
  searchQuery?: string;
  onChange: (change: { searchQuery?: string }) => void;
};

export function SearchControls({ searchQuery, onChange }: SearchControlsProps) {
  const [value, setValue] = useState(searchQuery ?? "");

  useEffect(() => {
    const handler = setTimeout(() => {
      onChange({ searchQuery: value });
    }, 300);
    return () => clearTimeout(handler);
  }, [value, onChange]);

  // Update local state when external searchQuery changes
  useEffect(() => {
    setValue(searchQuery ?? "");
  }, [searchQuery]);

  return (
    <div className="flex shrink-0">
      <Input
        id="search"
        placeholder="Search..."
        value={value}
        onChange={e => setValue(e.target.value)}
      />
    </div>
  );
}
