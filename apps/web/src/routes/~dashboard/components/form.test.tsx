import { it } from "vitest";

import JobForm from "@/web/routes/~dashboard/components/form";
import { render } from "@/web/setup-tests";

it("renders the form component", () => {
  render(<JobForm />);
  // screen.debug();
});
