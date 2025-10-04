import { isValidEmail } from "@/lib/utils/validators";

describe("validators", () => {
  test("isValidEmail", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
    expect(isValidEmail("user+tag@domain.co")).toBe(true);
    expect(isValidEmail("invalid")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });

});


