import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Medicine } from "@/Types/MainTypes";

vi.mock("@/components/BubbleBackground", () => ({
  default: () => <div data-testid="bubble-bg" />,
}));

vi.mock("@/components/layouts/Header", () => ({
  default: ({
    onSearchSubmit,
    onSearchChange,
    searchValue,
    isSearchLoading,
  }: any) => (
    <div data-testid="header">
      <input
        data-testid="search-input"
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <button
        data-testid="search-btn"
        onClick={onSearchSubmit}
        disabled={isSearchLoading}
      >
        {isSearchLoading ? "Loading" : "Search"}
      </button>
    </div>
  ),
}));

vi.mock("@/components/MedicineCard", () => ({
  default: ({ mark, dci, id }: any) => (
    <div data-testid="medicine-card">
      <span data-testid="med-mark">{mark}</span>
      <span data-testid="med-dci">{dci}</span>
      <span data-testid="med-id">{id}</span>
    </div>
  ),
}));

vi.mock("@/services/openrouter", () => ({
  chatWithAI: vi.fn(),
}));

const mockMedicine: Medicine = {
  id: 1,
  mark: "Doliprane",
  dci: "Paracetamol",
  name: "Doliprane 1000",
  dosage: "1g",
};

const mockMedicine2: Medicine = {
  id: 2,
  mark: "Ibuprofene",
  dci: "Ibuprofène",
  name: "Ibuprofene 400",
  dosage: "400mg",
};

function jsonResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
  } as Response;
}

describe("Index page", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn());
    import.meta.env.VITE_OPENROUTER_API_KEY = "test-key";
    import.meta.env.VITE_GROQ_API_KEY = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete import.meta.env.VITE_OPENROUTER_API_KEY;
    delete import.meta.env.VITE_GROQ_API_KEY;
  });

  it("renders the welcome screen on initial load", async () => {
    const { default: Index } = await import("./Index");
    render(<Index />);
    expect(
      screen.getByText(/Search for any medicine in our database/),
    ).toBeInTheDocument();
  });

  describe("DB Search", () => {
    it("returns empty for blank query", async () => {
      const user = userEvent.setup();
      const { default: Index } = await import("./Index");
      render(<Index />);

      await user.click(screen.getByTestId("search-btn"));
      await waitFor(() => {
        expect(fetch).not.toHaveBeenCalled();
      });
    });

    it("searches by numeric ID", async () => {
      const user = userEvent.setup();
      (fetch as any).mockResolvedValue(jsonResponse(mockMedicine));
      const { default: Index } = await import("./Index");

      render(<Index />);
      await user.type(screen.getByTestId("search-input"), "1");
      await user.click(screen.getByTestId("search-btn"));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("/medicines/1"),
        );
      });
      expect(await screen.findAllByTestId("medicine-card")).toHaveLength(1);
      expect(screen.getByTestId("med-mark")).toHaveTextContent("Doliprane");
    });

    it("searches by text query and returns partial matches", async () => {
      const user = userEvent.setup();
      const meds: Medicine[] = [
        { id: 1, mark: "Doliprane Forte", dci: "Paracetamol" },
        { id: 2, mark: "Efferalgan", dci: "Doliprane IR" },
      ];
      (fetch as any).mockResolvedValue(jsonResponse({ medicines: meds }));
      const { default: Index } = await import("./Index");

      render(<Index />);
      await user.type(screen.getByTestId("search-input"), "doliprane");
      await user.click(screen.getByTestId("search-btn"));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("/medicines?q=doliprane"),
        );
      });
      const cards = screen.getAllByTestId("medicine-card");
      expect(cards).toHaveLength(2);
    });

    it("filters exact matches over partial matches", async () => {
      const user = userEvent.setup();
      const mixed: Medicine[] = [
        { id: 3, mark: "Aspirine", dci: "Acide Acetylsalicylique" },
        { id: 4, mark: "Doliprane", dci: "Paracetamol" },
        { id: 5, mark: "Paracetamol Biovea", dci: "Paracetamol" },
      ];
      (fetch as any).mockResolvedValue(jsonResponse({ medicines: mixed }));
      const { default: Index } = await import("./Index");

      render(<Index />);
      await user.type(screen.getByTestId("search-input"), "Paracetamol");
      await user.click(screen.getByTestId("search-btn"));

      await waitFor(() => {
        const cards = screen.getAllByTestId("medicine-card");
        expect(cards).toHaveLength(2);
      });
      const marks = screen.getAllByTestId("med-mark").map((el) => el.textContent);
      expect(marks).toContain("Doliprane");
      expect(marks).toContain("Paracetamol Biovea");
      expect(marks).not.toContain("Aspirine");
    });

    it("shows no-results message when API returns empty", async () => {
      const user = userEvent.setup();
      (fetch as any).mockResolvedValue(jsonResponse([]));
      const { default: Index } = await import("./Index");

      render(<Index />);
      await user.type(screen.getByTestId("search-input"), "xyznone");
      await user.click(screen.getByTestId("search-btn"));

      await waitFor(() => {
        expect(
          screen.getByText(/No medicines found for "xyznone"/),
        ).toBeInTheDocument();
      });
    });

    it("shows no-results when fetch rejects (errors swallowed by search)", async () => {
      const user = userEvent.setup();
      (fetch as any).mockRejectedValue(new Error("Network fail"));
      const { default: Index } = await import("./Index");

      render(<Index />);
      await user.type(screen.getByTestId("search-input"), "test");
      await user.click(screen.getByTestId("search-btn"));

      await waitFor(() => {
        expect(
          screen.getByText(/No medicines found for "test"/),
        ).toBeInTheDocument();
      });
    });

    it("shows no results for non-ok numeric ID response", async () => {
      const user = userEvent.setup();
      (fetch as any).mockResolvedValue(jsonResponse(null, false, 404));
      const { default: Index } = await import("./Index");

      render(<Index />);
      await user.type(screen.getByTestId("search-input"), "999");
      await user.click(screen.getByTestId("search-btn"));

      await waitFor(() => {
        expect(
          screen.getByText(/No medicines found for "999"/),
        ).toBeInTheDocument();
      });
    });

    it("handles payload with data array wrapper", async () => {
      const user = userEvent.setup();
      (fetch as any).mockResolvedValue(
        jsonResponse({ data: [mockMedicine] }),
      );
      const { default: Index } = await import("./Index");

      render(<Index />);
      await user.type(screen.getByTestId("search-input"), "doliprane");
      await user.click(screen.getByTestId("search-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("med-mark")).toHaveTextContent("Doliprane");
      });
    });

    it("returns empty for numeric ID with no id field in response", async () => {
      const user = userEvent.setup();
      (fetch as any).mockResolvedValue(jsonResponse({ mark: "X" }));
      const { default: Index } = await import("./Index");

      render(<Index />);
      await user.type(screen.getByTestId("search-input"), "42");
      await user.click(screen.getByTestId("search-btn"));

      await waitFor(() => {
        expect(
          screen.getByText(/No medicines found for "42"/),
        ).toBeInTheDocument();
      });
    });
  });

  describe("AI Overview", () => {
    it("calls chatWithAI when results found and AI key present", async () => {
      const user = userEvent.setup();
      (fetch as any).mockResolvedValue(
        jsonResponse({ medicines: [mockMedicine] }),
      );
      const { default: Index } = await import("./Index");
      const { chatWithAI } = await import("@/services/openrouter");
      const mockChatWithAI = vi.mocked(chatWithAI);
      mockChatWithAI.mockResolvedValue({
        content: "Paracetamol is a common pain reliever.",
        model: "test-model",
      });

      render(<Index />);
      await user.type(screen.getByTestId("search-input"), "paracetamol");
      await user.click(screen.getByTestId("search-btn"));

      await waitFor(() => {
        expect(mockChatWithAI).toHaveBeenCalled();
        expect(
          screen.getByText("Paracetamol is a common pain reliever."),
        ).toBeInTheDocument();
      });
    });

    it("shows fallback text when no AI key is configured", async () => {
      const user = userEvent.setup();
      import.meta.env.VITE_OPENROUTER_API_KEY = "";
      import.meta.env.VITE_GROQ_API_KEY = "";
      (fetch as any).mockResolvedValue(
        jsonResponse({ medicines: [mockMedicine] }),
      );

      const { default: Index } = await import("./Index");
      const { chatWithAI } = await import("@/services/openrouter");
      const mockChatWithAI = vi.mocked(chatWithAI);
      render(<Index />);

      await user.type(screen.getByTestId("search-input"), "doliprane");
      await user.click(screen.getByTestId("search-btn"));

      await waitFor(() => {
        expect(mockChatWithAI).not.toHaveBeenCalled();
        expect(
          screen.getByText(/Found 1 medicine\(s\) matching "doliprane"/),
        ).toBeInTheDocument();
      });
    });

    it("shows error message when chatWithAI throws", async () => {
      const user = userEvent.setup();
      (fetch as any).mockResolvedValue(
        jsonResponse({ medicines: [mockMedicine] }),
      );
      const { default: Index } = await import("./Index");
      const { chatWithAI } = await import("@/services/openrouter");
      const mockChatWithAI = vi.mocked(chatWithAI);
      mockChatWithAI.mockRejectedValue(new Error("API down"));

      render(<Index />);
      await user.type(screen.getByTestId("search-input"), "doliprane");
      await user.click(screen.getByTestId("search-btn"));

      await waitFor(() => {
        expect(
          screen.getByText(/An error occurred while searching/),
        ).toBeInTheDocument();
      });
    });

    it("shows no-results overview when medicines array is empty", async () => {
      const user = userEvent.setup();
      (fetch as any).mockResolvedValue(jsonResponse([]));
      const { default: Index } = await import("./Index");

      render(<Index />);
      await user.type(screen.getByTestId("search-input"), "none");
      await user.click(screen.getByTestId("search-btn"));

      await waitFor(() => {
        expect(
          screen.getByText(/No medicines found for "none"/),
        ).toBeInTheDocument();
      });
    });

    it("shows fallback overview listing labels when no AI key", async () => {
      const user = userEvent.setup();
      import.meta.env.VITE_OPENROUTER_API_KEY = "";
      import.meta.env.VITE_GROQ_API_KEY = "";
      const meds: Medicine[] = [
        { id: 1, mark: "Doliprane Forte", dci: "Paracetamol" },
        { id: 2, mark: "Efferalgan", dci: "Doliprane IR" },
      ];
      (fetch as any).mockResolvedValue(jsonResponse({ medicines: meds }));

      const { default: Index } = await import("./Index");
      render(<Index />);

      await user.type(screen.getByTestId("search-input"), "doliprane");
      await user.click(screen.getByTestId("search-btn"));

      await waitFor(() => {
        expect(
          screen.getByText(/Found 2 medicine\(s\) matching "doliprane"/),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Loading state", () => {
    it("disables search button during loading", async () => {
      const user = userEvent.setup();
      let resolveFetch!: (v: any) => void;
      (fetch as any).mockImplementation(
        () => new Promise((r) => (resolveFetch = r)),
      );
      const { default: Index } = await import("./Index");

      render(<Index />);
      await user.type(screen.getByTestId("search-input"), "doliprane");
      await user.click(screen.getByTestId("search-btn"));

      expect(screen.getByTestId("search-btn")).toHaveTextContent("Loading");
      expect(screen.getByTestId("search-btn")).toBeDisabled();

      resolveFetch(jsonResponse([]));
      await waitFor(() => {
        expect(screen.getByTestId("search-btn")).toHaveTextContent("Search");
      });
    });

    it("prevents double submission while loading", async () => {
      const user = userEvent.setup();
      (fetch as any).mockImplementation(() => new Promise(() => {}));
      const { default: Index } = await import("./Index");

      render(<Index />);
      await user.type(screen.getByTestId("search-input"), "test");
      await user.click(screen.getByTestId("search-btn"));
      await user.click(screen.getByTestId("search-btn"));

      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("AI Overview content", () => {
    it("sends correct context to chatWithAI with medicine names and DCIs", async () => {
      const user = userEvent.setup();
      const meds: Medicine[] = [
        { id: 1, mark: "Doliprane", dci: "Paracetamol" },
        { id: 2, mark: "Efferalgan", dci: "Paracetamol" },
      ];
      (fetch as any).mockResolvedValue(jsonResponse({ medicines: meds }));
      const { default: Index } = await import("./Index");
      const { chatWithAI } = await import("@/services/openrouter");
      const mockChatWithAI = vi.mocked(chatWithAI);
      mockChatWithAI.mockResolvedValue({ content: "Overview text", model: "m" });

      render(<Index />);
      await user.type(screen.getByTestId("search-input"), "paracetamol");
      await user.click(screen.getByTestId("search-btn"));

      await waitFor(() => {
        const messages = mockChatWithAI.mock.calls[0][0];
        const userMsg = messages.find((m: any) => m.role === "user");
        expect(userMsg.content).toContain("Doliprane, Efferalgan");
        expect(userMsg.content).toContain("Paracetamol");
      });
    });
  });
});
