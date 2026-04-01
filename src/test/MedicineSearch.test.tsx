import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import MedicineSearch from "@/components/MedicineSearch";

Element.prototype.scrollIntoView = vi.fn();

vi.mock("@/services/openrouter", () => ({
  getAIResponse: vi.fn(),
  chatWithAI: vi.fn().mockResolvedValue({
    content: "Mock AI response",
    model: "test-model",
  }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("MedicineSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe("Landing Page", () => {
    it("renders landing page with title and description", () => {
      renderWithRouter(<MedicineSearch />);

      expect(screen.getAllByText("Avicenna")[0]).toBeInTheDocument();
      expect(
        screen.getByText(/Search for any medicine/i)
      ).toBeInTheDocument();
    });

    it("renders Sparkles icon in landing", () => {
      renderWithRouter(<MedicineSearch />);
      const sparklesIcon = document.querySelector(".text-primary-foreground");
      expect(sparklesIcon).toBeInTheDocument();
    });

    it("renders search input with placeholder", () => {
      renderWithRouter(<MedicineSearch />);
      const textarea = screen.getByPlaceholderText(/Search for a medicine/i);
      expect(textarea).toBeInTheDocument();
    });

    it("renders submit button", () => {
      renderWithRouter(<MedicineSearch />);
      const submitButton = document.querySelector('button[type="submit"]');
      expect(submitButton).toBeInTheDocument();
    });

    it("submit button is disabled when input is empty", () => {
      renderWithRouter(<MedicineSearch />);
      const submitButton = document.querySelector('button[type="submit"]');
      expect(submitButton).toBeDisabled();
    });

    it("renders suggestion buttons from localStorage", () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(["Aspirin", "Ibuprofen"]));
      renderWithRouter(<MedicineSearch />);

      expect(screen.getAllByText("Aspirin")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Ibuprofen")[0]).toBeInTheDocument();
    });
  });

  describe("User Input", () => {
    it("updates input value on typing", async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicineSearch />);

      const textarea = screen.getByPlaceholderText(/Search for a medicine/i);
      await user.type(textarea, "Aspirin");

      expect(textarea).toHaveValue("Aspirin");
    });

    it("submits search on Enter key press", async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicineSearch />);

      const textarea = screen.getByPlaceholderText(/Search for a medicine/i);
      await user.type(textarea, "Aspirin{enter}");

      await waitFor(() => {
        expect(screen.getByText("Aspirin")).toBeInTheDocument();
      });
    });

    it("does not submit on Shift+Enter", async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicineSearch />);

      const textarea = screen.getByPlaceholderText(/Search for a medicine/i);
      await user.type(textarea, "Aspirin{Shift>}{Enter}{/Shift}");

      await waitFor(() => {
        const submitButton = document.querySelectorAll('button[type="submit"]')[0];
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe("Search History", () => {
    it("saves search query to localStorage", async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicineSearch />);

      const textarea = screen.getByPlaceholderText(/Search for a medicine/i);
      await user.type(textarea, "Aspirin{enter}");

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "search-history",
          expect.any(String)
        );
      });
    });

    it("duplicates are not added to history", async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(["Aspirin"]));
      const user = userEvent.setup();
      renderWithRouter(<MedicineSearch />);

      const textarea = screen.getByPlaceholderText(/Search for a medicine/i);
      await user.type(textarea, "Aspirin{enter}");

      await waitFor(() => {
        const setItemCalls = localStorageMock.setItem.mock.calls;
        const historyCall = setItemCalls.find(
          (call) => call[0] === "search-history"
        );
        if (historyCall) {
          const history = JSON.parse(historyCall[1] as string);
          const aspirinCount = history.filter(
            (q: string) => q.toLowerCase() === "aspirin"
          ).length;
          expect(aspirinCount).toBe(1);
        }
      });
    });

    it("shows new search as first item in history", async () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(["Ibuprofen", "Paracetamol"])
      );
      const user = userEvent.setup();
      renderWithRouter(<MedicineSearch />);

      const textarea = screen.getByPlaceholderText(/Search for a medicine/i);
      await user.type(textarea, "Aspirin{enter}");

      await waitFor(() => {
        const setItemCalls = localStorageMock.setItem.mock.calls;
        const historyCall = setItemCalls.find(
          (call) => call[0] === "search-history"
        );
        if (historyCall) {
          const history = JSON.parse(historyCall[1] as string);
          expect(history[0]).toBe("Aspirin");
        }
      });
    });
  });

  describe("Loading States", () => {
    it("shows loading indicator during search", async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const user = userEvent.setup();
      renderWithRouter(<MedicineSearch />);

      const textarea = document.querySelectorAll('textarea[placeholder*="Search for a medicine"]')[0];
      await user.type(textarea as HTMLElement, "Aspirin{enter}");

      await waitFor(() => {
        const loadingDots = document.querySelectorAll(".rounded-full.bg-muted-foreground\\/50");
        expect(loadingDots.length).toBe(3);
      }, { timeout: 2000 });
    });
  });

  describe("Message Display", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          medicines: [{ id: 1, mark: "Aspirin", dci: "Acetylsalicylic acid", name: "Aspirin" }],
        }),
      });
    });

    it("displays user message after search", async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicineSearch />);

      const textarea = screen.getByPlaceholderText(/Search for a medicine/i);
      await user.type(textarea, "Aspirin{enter}");

      await waitFor(() => {
        expect(screen.getByText("Aspirin")).toBeInTheDocument();
      });
    });

    it("displays assistant response after search", async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicineSearch />);

      const textarea = screen.getByPlaceholderText(/Search for a medicine/i);
      await user.type(textarea, "Aspirin{enter}");

      await waitFor(
        () => {
          expect(screen.getByText(/Medical Information/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("displays disclaimer text in assistant response", async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicineSearch />);

      const textarea = screen.getByPlaceholderText(/Search for a medicine/i);
      await user.type(textarea, "Aspirin{enter}");

      await waitFor(
        () => {
          expect(screen.getByText(/Always consult a healthcare professional/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("shows pharmacies when available in response", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            medicines: [{ id: 1, mark: "Aspirin", dci: "Acetylsalicylic acid", name: "Aspirin" }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            medicine_id: 1,
            medicine_mark: "Aspirin",
            medicine_dci: "Acetylsalicylic acid",
            pharmacies_count: 2,
            pharmacies: [
              {
                id: 1,
                name: "Pharmacy Central",
                address: "123 Main St",
                city: "Algiers",
                wilaya: "Algiers",
                lat: 36.7538,
                lng: 3.0588,
                status: "active",
              },
              {
                id: 2,
                name: "Pharmacy North",
                address: "456 Oak Ave",
                city: "Algiers",
                wilaya: "Algiers",
                lat: 36.7540,
                lng: 3.0590,
                status: "inactive",
              },
            ],
          }),
        });

      const user = userEvent.setup();
      renderWithRouter(<MedicineSearch />);

      const textarea = screen.getByPlaceholderText(/Search for a medicine/i);
      await user.type(textarea, "Aspirin{enter}");

      await waitFor(
        () => {
          expect(screen.getByText(/Nearby Pharmacies/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it("displays side effects when available", async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicineSearch />);

      const textarea = screen.getByPlaceholderText(/Search for a medicine/i);
      await user.type(textarea, "Aspirin{enter}");

      await waitFor(
        () => {
          expect(screen.getByText(/Side Effects/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe("Medicine Not Found", () => {
    it("shows not found message when medicine cannot be matched", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          medicines: [],
        }),
      });

      const user = userEvent.setup();
      renderWithRouter(<MedicineSearch />);

      const textarea = screen.getByPlaceholderText(/Search for a medicine/i);
      await user.type(textarea, "UnknownMed{enter}");

      await waitFor(
        () => {
          expect(screen.getByText(/could not match/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe("Error Handling", () => {
    it("handles fetch errors gracefully", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const user = userEvent.setup();
      renderWithRouter(<MedicineSearch />);

      const textarea = document.querySelectorAll('textarea[placeholder*="Search for a medicine"]')[0];
      await user.type(textarea as HTMLElement, "Aspirin{enter}");

      await waitFor(
        () => {
          expect(screen.getByText(/Medical Information/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });

  describe("Navigation Link", () => {
    it("renders navigation link with correct href", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            medicines: [{ id: 1, mark: "Aspirin", dci: "Acetylsalicylic acid", name: "Aspirin" }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            medicine_id: 1,
            medicine_mark: "Aspirin",
            pharmacies_count: 1,
            pharmacies: [
              {
                id: 1,
                name: "Pharmacy Central",
                address: "123 Main St",
                city: "Algiers",
                wilaya: "Algiers",
                lat: 36.7538,
                lng: 3.0588,
                status: "active",
              },
            ],
          }),
        });

      const user = userEvent.setup();
      renderWithRouter(<MedicineSearch />);

      const textarea = document.querySelectorAll('textarea[placeholder*="Search for a medicine"]')[0];
      await user.type(textarea as HTMLElement, "Aspirin{enter}");

      await waitFor(
        () => {
          const navLink = document.querySelector('a[href*="google.com/maps"]');
          expect(navLink).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });

  describe("Availability Badge", () => {
    it("shows Available badge for active pharmacies", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            medicines: [{ id: 1, mark: "Aspirin", dci: "Acetylsalicylic acid", name: "Aspirin" }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            medicine_id: 1,
            medicine_mark: "Aspirin",
            pharmacies_count: 1,
            pharmacies: [
              {
                id: 1,
                name: "Pharmacy Central",
                address: "123 Main St",
                city: "Algiers",
                wilaya: "Algiers",
                lat: 36.7538,
                lng: 3.0588,
                status: "active",
              },
            ],
          }),
        });

      const user = userEvent.setup();
      renderWithRouter(<MedicineSearch />);

      const textarea = screen.getByPlaceholderText(/Search for a medicine/i);
      await user.type(textarea, "Aspirin{enter}");

      await waitFor(
        () => {
          expect(screen.getByText("Available")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it("shows Unavailable badge for inactive pharmacies", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            medicines: [{ id: 1, mark: "Aspirin", dci: "Acetylsalicylic acid", name: "Aspirin" }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            medicine_id: 1,
            medicine_mark: "Aspirin",
            pharmacies_count: 1,
            pharmacies: [
              {
                id: 1,
                name: "Pharmacy Central",
                address: "123 Main St",
                city: "Algiers",
                wilaya: "Algiers",
                lat: 36.7538,
                lng: 3.0588,
                status: "inactive",
              },
            ],
          }),
        });

      const user = userEvent.setup();
      renderWithRouter(<MedicineSearch />);

      const textarea = screen.getByPlaceholderText(/Search for a medicine/i);
      await user.type(textarea, "Aspirin{enter}");

      await waitFor(
        () => {
          expect(screen.getByText("Unavailable")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });

  describe("Numeric ID Search", () => {
    it("handles direct numeric ID search", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            medicines: [{ id: 123, mark: "TestMed", dci: "TestDCI", name: "TestMed" }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            medicine_id: 123,
            medicine_mark: "TestMed",
            pharmacies_count: 1,
            pharmacies: [
              {
                id: 1,
                name: "Pharmacy 1",
                address: "Address",
                city: "City",
                wilaya: "Wilaya",
                status: "active",
              },
            ],
          }),
        });

      const user = userEvent.setup();
      renderWithRouter(<MedicineSearch />);

      const textarea = screen.getByPlaceholderText(/Search for a medicine/i);
      await user.type(textarea, "123{enter}");

      await waitFor(
        () => {
          expect(screen.getByText(/Medical Information/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });

  describe("Empty Search Prevention", () => {
    it("does not submit empty search", async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicineSearch />);

      const textarea = screen.getByPlaceholderText(/Search for a medicine/i);
      const submitButton = document.querySelector('button[type="submit"]');

      expect(submitButton).toBeDisabled();
      
      await user.click(submitButton!);
      
      await waitFor(() => {
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });
  });

  describe("StyledResponse Component", () => {
    it("renders assistant response content", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          medicines: [{ id: 1, mark: "Aspirin", dci: "Acetylsalicylic acid", name: "Aspirin" }],
        }),
      });

      const user = userEvent.setup();
      renderWithRouter(<MedicineSearch />);

      const textarea = screen.getByPlaceholderText(/Search for a medicine/i);
      await user.type(textarea, "Aspirin{enter}");

      await waitFor(
        () => {
          expect(screen.getAllByText(/Medical Information/)[0]).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });
});
