import { it } from "vitest";

import JobForm from "@/web/routes/~dashboard/~jobs/components/form";
import { renderWithQueryClient } from "@/web/test/test-utils";

it("renders the form component", () => {
  renderWithQueryClient(<JobForm onCancel={() => {}} />);
  // screen.debug();
});
