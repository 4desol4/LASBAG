import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { JourneyTracker } from "../components/JourneyTracker";
import { Dialog } from "../components/ui/Dialog";
import { DropZone } from "../components/ui/DropZone";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Tabs } from "../components/ui/Tabs";
import { fmtSize, timeAgo } from "../lib/format";

const stages = [
  { key: "REQUIREMENTS", label: "Requirements", state: "COMPLETED" as const },
  { key: "SUBMISSION", label: "Submission", state: "IN_PROGRESS" as const },
  { key: "CLEARANCES", label: "Clearances", state: "PENDING" as const },
];

describe("JourneyTracker", () => {
  it("marks the current stage and states every stage in words, not colour alone", () => {
    render(<JourneyTracker stages={stages} progress={33} />);
    expect(screen.getByText("Submission").closest("li")?.getAttribute("aria-current")).toBe("step");
    expect(screen.getByText("Completed")).toBeTruthy(); expect(screen.getByText("In progress")).toBeTruthy(); expect(screen.getByText("Pending")).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Journey progress" }).getAttribute("aria-valuenow")).toBe("33");
  });
});
describe("StatusBadge", () => {
  it("always renders a word", () => { render(<><StatusBadge status="ACTION_NEEDED" /><StatusBadge status="IN_REVIEW" /></>); expect(screen.getByText("Action needed")).toBeTruthy(); expect(screen.getByText("In progress")).toBeTruthy(); });
});
describe("DropZone", () => {
  it("rejects unsupported file types with a plain message", () => {
    const onFile = vi.fn(); const { container } = render(<DropZone onFile={onFile} state="idle" progress={0} />);
    const input = container.querySelector("input[type=file]") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["x"], "virus.exe")] } });
    expect(onFile).not.toHaveBeenCalled(); expect(screen.getByRole("alert").textContent).toContain("PDF, PNG or JPG");
  });
  it("accepts a PDF", () => {
    const onFile = vi.fn(); const { container } = render(<DropZone onFile={onFile} state="idle" progress={0} />);
    fireEvent.change(container.querySelector("input[type=file]")!, { target: { files: [new File(["%PDF"], "plan.pdf", { type: "application/pdf" })] } });
    expect(onFile).toHaveBeenCalledTimes(1);
  });
});
describe("Dialog", () => {
  const Host = () => { const [o, s] = useState(true); return <Dialog open={o} onClose={() => s(false)} title="Submit?"><button>OK</button></Dialog>; };
  it("is a labelled modal and closes on Escape", () => {
    render(<Host />);
    const d = screen.getByRole("dialog"); expect(d.getAttribute("aria-modal")).toBe("true"); expect(d.getAttribute("aria-labelledby")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
  });
});
describe("Tabs", () => {
  it("moves selection with arrow keys", () => {
    const onChange = vi.fn(); render(<Tabs tabs={[{ key: "a", label: "A" }, { key: "b", label: "B" }]} value="a" onChange={onChange} label="Test" />);
    fireEvent.keyDown(screen.getByRole("tab", { name: "A" }), { key: "ArrowRight" }); expect(onChange).toHaveBeenCalledWith("b");
  });
});
describe("format", () => {
  it("formats sizes and relative times", () => { expect(fmtSize(2048)).toBe("2 KB"); expect(fmtSize(3 * 1024 * 1024)).toBe("3.0 MB"); expect(timeAgo(new Date())).toBe("Just now"); });
});
