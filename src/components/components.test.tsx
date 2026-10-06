import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createDemoReturns } from "@/lib/demo-data";
import { ExtractionResult, scheduleHref } from "./assistant/ExtractionResult";
import { ReturnCard } from "./returns/ReturnCard";
import { ReturnTimeline } from "./returns/ReturnTimeline";
import { StatusBadge } from "./returns/StatusBadge";

const NOW = new Date("2026-10-02T10:00");
const demo = createDemoReturns(NOW);

describe("StatusBadge", () => {
  it("shows the human-readable status", () => {
    render(<StatusBadge status="refund_processing" />);
    expect(screen.getByText("Refund Processing")).toBeInTheDocument();
  });
});

describe("ReturnTimeline", () => {
  it("marks the current step for assistive technology", () => {
    render(<ReturnTimeline record={demo.find((r) => r.status === "in_transit")!} />);
    const current = screen.getByRole("listitem", { current: "step" });
    expect(within(current).getByText("In Transit")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
  });
});

describe("ReturnCard", () => {
  it("shows the key facts and links to the detail page", () => {
    const zara = demo.find((r) => r.retailerName === "Zara")!;
    render(<ReturnCard record={zara} now={NOW} />);
    expect(screen.getByRole("link", { name: /Black blazer/ })).toHaveAttribute(
      "href",
      "/returns/RD-2026-2013",
    );
    expect(screen.getByText("$89.90")).toBeInTheDocument();
    expect(screen.getByText("RD-2026-2013")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByText("5 days before the deadline")).toBeInTheDocument();
  });
});

describe("ExtractionResult", () => {
  const result = {
    engine: "rules" as const,
    summary: "Your Nike return is eligible until October 18.",
    nextAction: {
      title: "Schedule a doorstep pickup",
      detail: "No rush.",
      urgency: "normal" as const,
    },
    extraction: {
      retailer: "Nike",
      retailerId: "nike",
      orderNumber: null,
      itemDescription: null,
      refundAmount: 139.99,
      deadline: "2026-10-18",
      deadlineEvidence: "eligible until October 18",
      windowDays: null,
      method: "qr_code" as const,
      carrier: "UPS" as const,
      labelRequirement: "not_required" as const,
      packagingRequirement: "unknown" as const,
      conditions: [],
    },
  };

  it("labels demo extraction honestly and links to a prefilled schedule", () => {
    render(<ExtractionResult result={result} />);
    expect(screen.getByText(/rule-based demo parser/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Schedule this return/ })).toHaveAttribute(
      "href",
      "/schedule?retailer=nike&deadline=2026-10-18&amount=139.99&carrier=UPS&qr=yes",
    );
  });

  it("builds a bare schedule link when nothing was found", () => {
    expect(
      scheduleHref({
        ...result,
        extraction: {
          ...result.extraction,
          retailer: null,
          retailerId: null,
          deadline: null,
          refundAmount: null,
          carrier: null,
          method: "unknown",
        },
      }),
    ).toBe("/schedule");
  });
});

// --- Full scheduling flow -------------------------------------------------

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/schedule",
}));

describe("ScheduleWizard", () => {
  it("walks through all steps, validates, and shows the confirmation", async () => {
    const user = userEvent.setup();
    const { ScheduleWizard } = await import("./schedule/ScheduleWizard");
    const { ToastProvider } = await import("./ui/Toast");
    const { buildReturnRecord } = await import("@/lib/create-return");
    const { createReturnSchema } = await import("@/lib/schemas");

    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const input = createReturnSchema.parse(JSON.parse(String(init?.body)));
      return new Response(JSON.stringify({ return: buildReturnRecord(input, new Date()) }), {
        status: 201,
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    window.scrollTo = vi.fn();

    render(
      <ToastProvider>
        <ScheduleWizard />
      </ToastProvider>,
    );

    // Step 1: retailer — continuing without a choice shows an error.
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Choose where you bought it")).toBeInTheDocument();
    // The email comes first and is required.
    expect(
      screen.getByText("Enter your email so we can send your confirmation"),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /Your email/ })).toHaveFocus();
    await user.type(screen.getByRole("textbox", { name: /Your email/ }), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    await user.clear(screen.getByRole("textbox", { name: /Your email/ }));
    await user.type(screen.getByRole("textbox", { name: /Your email/ }), "alex@example.com");
    await user.type(screen.getByRole("searchbox", { name: "Search retailers" }), "zar");
    await user.click(screen.getByRole("radio", { name: /Zara/ }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Step 2: details — only the item is required.
    expect(await screen.findByRole("heading", { name: "What are you returning?" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText(/Describe the item/)).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: /^Item/ }), "Black blazer");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Step 3: method.
    expect(await screen.findByText("We pick it up. You move on.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Step 4: pickup — choose the first available day and window, use the demo address.
    await screen.findByRole("heading", { name: "When should we come by?" });
    const days = screen
      .getAllByRole("radio")
      .filter((el) => el.getAttribute("name") === "pickupDate");
    await user.click(days.find((el) => !(el as HTMLInputElement).disabled)!);
    const windows = screen
      .getAllByRole("radio")
      .filter((el) => el.getAttribute("name") === "windowId");
    await user.click(windows.find((el) => !(el as HTMLInputElement).disabled)!);
    await user.click(screen.getByRole("button", { name: /Use demo address/ }));

    await user.click(screen.getByRole("button", { name: /Schedule pickup/ }));

    // Confirmation.
    expect(
      await screen.findByRole("heading", { name: /Your return is scheduled/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/^RD-\d{4}-\d{4}$/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledOnce();

    vi.unstubAllGlobals();
  });

  it("shows a friendly error when scheduling fails", async () => {
    const user = userEvent.setup();
    const { ScheduleWizard } = await import("./schedule/ScheduleWizard");
    const { ToastProvider } = await import("./ui/Toast");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 500 })),
    );
    window.scrollTo = vi.fn();

    render(
      <ToastProvider>
        <ScheduleWizard />
      </ToastProvider>,
    );
    await user.type(screen.getByRole("textbox", { name: /Your email/ }), "alex@example.com");
    await user.click(screen.getByRole("radio", { name: /Nike/ }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(await screen.findByRole("textbox", { name: /^Item/ }), "Sneakers");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(await screen.findByRole("button", { name: "Continue" }));
    await screen.findByRole("heading", { name: "When should we come by?" });
    const days = screen
      .getAllByRole("radio")
      .filter((el) => el.getAttribute("name") === "pickupDate");
    await user.click(days.find((el) => !(el as HTMLInputElement).disabled)!);
    const windows = screen
      .getAllByRole("radio")
      .filter((el) => el.getAttribute("name") === "windowId");
    await user.click(windows.find((el) => !(el as HTMLInputElement).disabled)!);
    await user.click(screen.getByRole("button", { name: /Use demo address/ }));
    await user.click(screen.getByRole("button", { name: /Schedule pickup/ }));

    expect(
      (await screen.findAllByText("Something went wrong while scheduling your pickup.")).length,
    ).toBeGreaterThan(0);
    vi.unstubAllGlobals();
  });
});
