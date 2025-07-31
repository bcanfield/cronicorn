import type { selectApiKeysSchema } from "@tasks-app/api/schema";

import ApiKey from "@/web/routes/~dashboard/~api-keys/components/api-key";

export default function ApiKeyList({ apiKeys }: { apiKeys: selectApiKeysSchema[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 ">
      {apiKeys.map(apiKey => (
        <ApiKey apiKey={apiKey} key={apiKey.id} />
      ))}
    </div>
  );
}
