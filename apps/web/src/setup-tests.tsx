// test-utils.tsx
import "@testing-library/jest-dom";
import type { RenderOptions } from "@testing-library/react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render as rtlRender } from "@testing-library/react";
import {
  NuqsTestingAdapter,
  type OnUrlUpdateFunction,
} from "nuqs/adapters/testing";
import React from "react";

const queryClient = new QueryClient();

type ExtendedRenderOptions = {
  searchParams?: string;
  onUrlUpdate?: OnUrlUpdateFunction;
} & Omit<RenderOptions, "wrapper">;

const customRender = (
  ui: React.ReactElement,
  {
    searchParams,
    onUrlUpdate,
    ...renderOptions
  }: ExtendedRenderOptions = {},
) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <NuqsTestingAdapter
      // only pass the props if they exist
      {...(searchParams ? { searchParams } : {})}
      {...(onUrlUpdate ? { onUrlUpdate } : {})}
    >
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </NuqsTestingAdapter>
  );

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
};

// re‑export everything
export * from "@testing-library/react";
// override render
export { customRender as render };
