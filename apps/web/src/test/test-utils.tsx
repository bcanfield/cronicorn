import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";

export function renderWithQueryClient(ui: ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false /* disable retries in tests */ } },
  });
  return render(
    <QueryClientProvider client={qc}>
      {ui}
    </QueryClientProvider>,
  );
}
