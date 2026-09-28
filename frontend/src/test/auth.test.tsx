import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Login from "../pages/Login";
import Register from "../pages/Register";

vi.mock("../features/auth/AuthContext", () => ({
  homeFor: () => "/dashboard",
  useAuth: () => ({ login: vi.fn(), register: vi.fn() }),
}));

describe("authentication pages", () => {
  it("reveals and hides the sign-in password and links to seeded accounts in development", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    const password = screen.getByLabelText("Password") as HTMLInputElement;
    expect(password.type).toBe("password");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password.type).toBe("text");
    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password.type).toBe("password");
    expect(
      screen
        .getByRole("link", { name: "View seeded test accounts" })
        .getAttribute("href"),
    ).toBe("/dev/accounts");
  });

  it("toggles password and confirmation fields independently on registration", () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );
    const password = screen.getByLabelText("Password") as HTMLInputElement;
    const confirmation = screen.getByLabelText(
      "Confirm password",
    ) as HTMLInputElement;
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password.type).toBe("text");
    expect(confirmation.type).toBe("password");
    fireEvent.click(
      screen.getByRole("button", { name: "Show confirm password" }),
    );
    expect(confirmation.type).toBe("text");
  });
});
