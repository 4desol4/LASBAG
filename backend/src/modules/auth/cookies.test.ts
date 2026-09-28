import { describe, expect, it } from "vitest";
import { getSessionCookieOptions } from "./auth.routes.js";

describe("session cookie options", () => {
  it("allows cross-site cookies in production so the browser keeps the auth session", () => {
    const options = getSessionCookieOptions(15 * 60e3, "production");

    expect(options.sameSite).toBe("none");
    expect(options.secure).toBe(true);
    expect(options.httpOnly).toBe(true);
  });

  it("keeps lax cookies on local development", () => {
    const options = getSessionCookieOptions(15 * 60e3, "development");

    expect(options.sameSite).toBe("lax");
    expect(options.secure).toBe(false);
  });
});
