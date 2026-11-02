import { expect, it } from "vitest";
import { nextLayer } from "./layer";

it("cycles bottom → top → normal → bottom", () => {
  expect(nextLayer("bottom")).toBe("top");
  expect(nextLayer("top")).toBe("normal");
  expect(nextLayer("normal")).toBe("bottom");
});
