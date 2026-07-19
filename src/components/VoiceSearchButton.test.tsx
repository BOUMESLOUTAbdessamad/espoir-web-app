import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VoiceSearchButton from "./VoiceSearchButton";

const mockStartListening = vi.fn();
const mockStopListening = vi.fn();

let mockIsListening = false;
let mockTranscript = "";
let mockIsSupported = true;

vi.mock("@/hooks/useVoiceSearch", () => ({
  useVoiceSearch: () => ({
    isListening: mockIsListening,
    transcript: mockTranscript,
    isSupported: mockIsSupported,
    startListening: mockStartListening,
    stopListening: mockStopListening,
    error: null,
  }),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { animate, transition, ...domProps } = props;
      return <div {...domProps}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className}>{children}</div>
  ),
  DialogHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogTitle: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <h2 className={className}>{children}</h2>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockIsListening = false;
  mockTranscript = "";
  mockIsSupported = true;
});

describe("VoiceSearchButton", () => {
  it("renders mic button when speech recognition is supported", () => {
    render(<VoiceSearchButton onResult={vi.fn()} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders nothing when speech recognition is not supported", () => {
    mockIsSupported = false;
    const { container } = render(<VoiceSearchButton onResult={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });

  it("calls startListening and opens dialog on mic click", async () => {
    const user = userEvent.setup();
    render(<VoiceSearchButton onResult={vi.fn()} />);

    await user.click(screen.getByRole("button"));

    expect(mockStartListening).toHaveBeenCalled();
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
  });

  it("shows transcript when available", async () => {
    const user = userEvent.setup();
    mockTranscript = "doliprane";
    render(<VoiceSearchButton onResult={vi.fn()} />);

    await user.click(screen.getByRole("button"));

    expect(screen.getByText('"doliprane"')).toBeInTheDocument();
  });

  it("calls onResult and onSearchSubmit when Use this text is clicked", async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    const onSearchSubmit = vi.fn();
    mockTranscript = "paracetamol";

    render(<VoiceSearchButton onResult={onResult} onSearchSubmit={onSearchSubmit} />);

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Use this text"));

    expect(onResult).toHaveBeenCalledWith("paracetamol");
    expect(onSearchSubmit).toHaveBeenCalled();
    expect(mockStopListening).toHaveBeenCalled();
  });

  it("does not call onResult when transcript is empty", async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();

    render(<VoiceSearchButton onResult={onResult} />);

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Use this text"));

    expect(onResult).not.toHaveBeenCalled();
  });

  it("disables mic button when disabled prop is true", () => {
    render(<VoiceSearchButton onResult={vi.fn()} disabled />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("applies custom className", () => {
    render(<VoiceSearchButton onResult={vi.fn()} className="w-7 h-7" />);
    expect(screen.getByRole("button")).toHaveClass("w-7", "h-7");
  });
});
