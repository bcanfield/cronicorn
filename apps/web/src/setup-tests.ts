import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import React from "react";

const queryClient = new QueryClient();

const AllProviders = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

const customRender = (ui: React.ReactElement, options?: any) =>
    render(ui, { wrapper: AllProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };
