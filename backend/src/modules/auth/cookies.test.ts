import { describe, expect, it } from "vitest";
import {
  getSessionCookieOptions,
  resolveLoginIdentifier,
} from "./auth.routes.js";

describe("session cookie options", () => {
  it("allows cross-site cookies when the frontend is on a secure production domain", () => {
    const options = getSessionCookieOptions(
      15 * 60e3,
      "development",
      "https://lasbag.vercel.app",
    );

    expect(options.sameSite).toBe("none");
    expect(options.secure).toBe(true);
    expect(options.httpOnly).toBe(true);
  });

  it("keeps lax cookies on localhost development", () => {
    const options = getSessionCookieOptions(
      15 * 60e3,
      "development",
      "http://localhost:5173",
    );

    expect(options.sameSite).toBe("lax");
    expect(options.secure).toBe(false);
  });
});

describe("demo login identifiers", () => {
  it("maps only supported demo usernames to internal aliases", () => {
    expect(resolveLoginIdentifier("demo2")).toBe("demo2@demo.invalid");
    expect(resolveLoginIdentifier("OFFICER1")).toBe("officer1@demo.invalid");
    expect(resolveLoginIdentifier("otheruser")).toBe("otheruser");
  });

  it("does not allow internal demo aliases as login identifiers", () => {
    expect(resolveLoginIdentifier("demo2@demo.invalid")).toBeNull();
  });
});
