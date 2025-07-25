import type { OnUrlUpdateFunction } from "nuqs/adapters/testing";

import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { JobsDataTable } from "@/web/components/jobs-data-table";
import { render } from "@/web/setup-tests";

it("should update the query params on sort by status asc", async () => {
  const user = userEvent.setup();
  const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
  render(<JobsDataTable />, {
    onUrlUpdate,
  });

  const sortByStatusColumnHeader = screen.getByRole("columnheader", { name: "Status" });

  // Query for the button specifically within the statusColumnHeader
  const sortByStatusBtn = within(sortByStatusColumnHeader).getByRole("button", { name: /status/i });

  expect(sortByStatusBtn).toBeInTheDocument();

  await user.click(sortByStatusBtn);

  const ascMenuItem = await screen.findByRole("menuitemcheckbox", { name: "Asc" });
  expect(ascMenuItem).toBeInTheDocument();

  await user.click(ascMenuItem);

  expect(onUrlUpdate).toHaveBeenCalledOnce();
  const event = onUrlUpdate.mock.calls[0]![0]!;
  const raw = event.searchParams.get("sort")!;

  const parsedString = JSON.parse(raw);

  expect(parsedString).toEqual([{ id: "status", desc: false }]);
});
