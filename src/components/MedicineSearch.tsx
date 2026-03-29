import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp , MapPin, AlertTriangle, Sparkles, Bot, User, Zap, Navigation } from "lucide-react";
import SearchHistory from "./SearchHistory";
import { GradientText } from "./animate-ui/primitives/texts/gradient";
import { Medicine, Pharmacy, Message, PharmacyApiResponse } from "@/Types/MainTypes";
import { getAIResponse, chatWithAI, ChatMessage } from "@/services/openrouter";
import Header from "./layouts/Header";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api/v1").replace(/\/$/, "");
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const HAS_AI_KEY = Boolean(OPENROUTER_API_KEY);

const MOCK_RESPONSES: Record<string, { text: string; sideEffects: string[] }> = {
  default: {
    text: "I found information about this medication. Here are the pharmacies where it may be available, along with potential side effects to be aware of.",
    sideEffects: ["Nausea", "Headache", "Dizziness", "Fatigue", "Dry mouth"],
  },
};

const getMedicinesFromPayload = (payload: unknown): Medicine[] => {
  if (Array.isArray(payload)) {
    return payload as Medicine[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const typed = payload as Record<string, unknown>;
  if (Array.isArray(typed.medicines)) {
    return typed.medicines as Medicine[];
  }

  if (Array.isArray(typed.data)) {
    return typed.data as Medicine[];
  }

  return [];
};

const normalizePharmacy = (pharmacy: PharmacyApiResponse["pharmacies"][number]): Pharmacy => {
  const cityWilaya = [pharmacy.city, pharmacy.wilaya].filter(Boolean).join(", ");
  const availability = String(pharmacy.status ?? "").toLowerCase();

  return {
    id: pharmacy.id,
    name: pharmacy.name,
    address: pharmacy.address || cityWilaya || "Address not provided",
    distance: cityWilaya || "Location not provided",
    available: !["inactive", "closed", "unavailable", "false", "0"].includes(availability),
    price: "N/A",
    lat: pharmacy.lat,
    lng: pharmacy.lng,
  };
};

const tryResolveMedicineId = async (query: string): Promise<number | null> => {
  const trimmed = query.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  const encoded = encodeURIComponent(trimmed);


    const url =`${API_BASE_URL}/medicines?q=${encoded}`;


    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch medicine by ID with query: ${trimmed}`);
      }

      const payload = (await res.json()) as unknown;
      const medicines = getMedicinesFromPayload(payload);
      console.log(medicines)
      const exact = medicines.find((med) => {
        const values = [med.mark, med.dci, med.name]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase());
        return values.includes(trimmed.toLowerCase());
      });

      const partial = medicines.find((med) => {
        const values = [med.mark, med.dci, med.name]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase());
        return values.some((value) => value.includes(trimmed.toLowerCase()));
      });

      const found = exact ?? partial ?? medicines[0];
      if (found?.id) {
        return found.id;
      }
    } catch {
      // Try the next candidate endpoint shape.
    }
  

  return null;
};

const MarkdownContent = ({ content }: { content: string }) => {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  
  return (
    <div className="text-sm text-foreground leading-relaxed space-y-2">
      {parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={idx} className="font-bold">{part.replace(/\*\*/g, "")}</strong>;
        }
        if (part.trim()) {
          return <span key={idx}>{part}</span>;
        }
        return null;
      })}
    </div>
  );
};

const StyledResponse = ({ content }: { content: string }) => {
  const lines = content.split("\n").filter((l) => l.trim());
  const parts: { text: string; isBold: boolean }[] = [];
  
  for (const line of lines) {
    const segments = line.split(/(\*\*[^*]+\*\*)/g);
    for (const segment of segments) {
      if (segment.startsWith("**") && segment.endsWith("**")) {
        parts.push({ text: segment.replace(/\*\*/g, ""), isBold: true });
      } else if (segment.trim()) {
        parts.push({ text: segment, isBold: false });
      }
    }
  }

  if (parts.length === 0) {
    return <p className="text-sm text-foreground leading-relaxed">{content}</p>;
  }

  return (
    <p className="text-sm text-foreground leading-relaxed">
      {parts.map((part, idx) => (
        part.isBold ? (
          <strong key={idx} className="font-bold">{part.text}</strong>
        ) : (
          <span key={idx}>{part.text} </span>
        )
      ))}
    </p>
  );
};

const MedicineSearch = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem("search-history");
    return saved ? JSON.parse(saved) : [];
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [slowSearch, setSlowSearch] = useState(false);
  const [currentModel, setCurrentModel] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addToHistory = useCallback((query: string) => {
    setSearchHistory((prev) => {
      const filtered = prev.filter((q) => q.toLowerCase() !== query.toLowerCase());
      const updated = [query, ...filtered].slice(0, 30);
      localStorage.setItem("search-history", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setShowLanding(false);
    addToHistory(query.trim());

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    if (aiEnabled && HAS_AI_KEY) {
      await handleAISearch(query);
    } else {
      await handleDbSearch(query);
    }
  };

  const handleAISearch = async (query: string) => {
    setSlowSearch(false)
    const timer = setTimeout(() => setSlowSearch(true), 5000)

    try {
      const medicineId = await tryResolveMedicineId(query);
      
      let pharmacyData: { pharmacies?: Pharmacy[]; medicineName: string; medicineDCI?: string; medicineMark?: string } | null = null;
      
      if (medicineId) {
        const res = await fetch(`${API_BASE_URL}/medicines/${medicineId}/pharmacies?limit=5`);
        if (res.ok) {
          const payload = (await res.json()) as PharmacyApiResponse;
          pharmacyData = {
            pharmacies: payload.pharmacies.map(normalizePharmacy),
            medicineName: payload.medicine_dci || payload.medicine_mark || query,
            medicineDCI: payload.medicine_dci,
            medicineMark: payload.medicine_mark,
          };
        }
      }

      const messages: ChatMessage[] = [
        { role: "system", content: `You are Avicenna, a helpful medical/pharmacy assistant. Keep responses concise and in English. Always remind users to consult healthcare professionals for medical advice.` }
      ];

      if (pharmacyData) {
        let context = `The user searched for "${pharmacyData.medicineName}"`;
        if (pharmacyData.medicineDCI) context += ` (DCI: ${pharmacyData.medicineDCI})`;
        if (pharmacyData.medicineMark) context += ` (Brand: ${pharmacyData.medicineMark})`;
        
        if (pharmacyData.pharmacies && pharmacyData.pharmacies.length > 0) {
          context += "\n\n Pharmacies with this medicine:";
          pharmacyData.pharmacies.forEach((p, i) => {
            context += `\n${i + 1}. ${p.name} - ${p.address} (${p.available ? "Available" : "Unavailable"})`;
          });
        } else {
          context += "\n\nNo pharmacies have this medicine available.";
        }
        
        messages.push({ role: "user", content: context });
        messages.push({ role: "assistant", content: `I found information for "${pharmacyData.medicineName}". Here are the details:` });
      }

      messages.push({ role: "user", content: query });

      const { content: aiResponse, model } = await chatWithAI(messages);
      setCurrentModel(model);
      
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: aiResponse,
          pharmacies: pharmacyData?.pharmacies,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Error: ${error instanceof Error ? error.message : "Could not connect to AI. Check your API key."}`,
        },
      ]);
    } finally {
      clearTimeout(timer)
      setSlowSearch(false)
      setIsLoading(false);
    }
  };

  const handleDbSearch = async (query: string) => {
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const medicineId = await tryResolveMedicineId(query);

      if (!medicineId) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `I could not match **${query}** to a medicine in the database.`,
          },
        ]);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/medicines/${medicineId}/pharmacies?limit=5`);
      const payload = (await res.json()) as PharmacyApiResponse | { error?: string };

      if (!res.ok) {
        const errorMessage = "error" in payload ? payload.error : "Failed to fetch pharmacies.";

        if (
          res.status === 404 ||
          String(errorMessage ?? "")
            .toLowerCase()
            .includes("medicine not found")
        ) {
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: `Medicine **${query}** was not found in the database.`,
            },
          ]);
          return;
        }

        throw new Error(errorMessage || "Failed to fetch pharmacies.");
      }

      const pharmacies = (payload as PharmacyApiResponse).pharmacies.map(normalizePharmacy);
      const response = MOCK_RESPONSES.default;
      const medicineLabel =
        (payload as PharmacyApiResponse).medicine_mark || (payload as PharmacyApiResponse).medicine_dci || query;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          pharmacies.length > 0
            ? `**${medicineLabel}** - ${response.text}`
            : `**${medicineLabel}** - no pharmacy currently has this medicine listed as available.`,
        pharmacies,
        sideEffects: response.sideEffects,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Could not load pharmacies for **${query}**. ${error instanceof Error ? error.message : "Please try again."}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const localData = localStorage.getItem('search-history');
  const suggestions = localData ? JSON.parse(localData as string) : []

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto px-4">
      {/* Side bar */}
      <SearchHistory
        history={searchHistory}
        onSelect={handleSearch}
        onClear={() => {
          setSearchHistory([]);
          localStorage.removeItem("search-history");
        }}
        onRemove={(index) => {
          setSearchHistory((prev) => {
            const updated = prev.filter((_, i) => i !== index);
            localStorage.setItem("search-history", JSON.stringify(updated));
            return updated;
          });
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <Header onSideBarOen={() => setSidebarOpen(true)}  />
      {/* Messages / Landing */}
      <div className="flex-1 overflow-y-auto pb-4">
        <AnimatePresence mode="wait">
          {showLanding ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center h-full gap-6 text-center"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-warm flex items-center justify-center shadow-glow">
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                </div>
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  <GradientText text="Avicenna" neon className="text-2xl font-bold" />
                </h2>
                <p className="text-muted-foreground text-sm max-w-md">
                  Search for any medicine - find availability in nearby pharmacies and learn about side effects.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSearch(s)}
                    className="px-3 py-1.5 text-sm rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Search input inside landing */}
              <div className="w-full max-w-md mt-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearch(input);
                  }}
                  className="relative"
                >
                  <div className={`border rounded-3xl shadow-card flex items-center ${aiEnabled ? "ai-border-glow" : "glass"}`}>
                      {HAS_AI_KEY && (
                      <button
                        type="button"
                        onClick={() => setAiEnabled(!aiEnabled)}
                        disabled={isLoading}
                        className={`ml-3 mr-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                          aiEnabled
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Avicenna</span>
                      </button>
                    )}
                    {/* <Pill className="w-4 h-4 text-muted-foreground ml-4 shrink-0" /> */}
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Search for a medicine..."
                      className="flex-1 bg-transparent px-3 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="mr-2 w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 hover:opacity-90 transition-opacity"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </div>
                </form>
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  Powered by Espoir AI - Not a substitute for medical advice
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-warm flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  <div className={`max-w-[85%] space-y-3 ${msg.role === "user" ? "order-first" : ""}`}>
                    {msg.role === "assistant" ? (
                      <div className="bg-muted rounded-2xl rounded-bl-md overflow-hidden">
                        <div className="px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
                          <h3 className="font-bold text-foreground text-sm">Medical Information</h3>
                        </div>
                        <div className="p-4 space-y-3">
                          <StyledResponse content={msg.content} />
                          <div className="pt-2 mt-3 border-t border-primary/10">
                            <p className="text-[10px] text-muted-foreground italic">
                              * Always consult a healthcare professional
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed">
                        {msg.content}
                      </div>
                    )}

                    {/* Side Effects */}
                    {msg.sideEffects && (
                      <div className="glass rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground tracking-wide">
                          <AlertTriangle className="w-3.5 h-3.5 text-accent" />
                          Side Effects
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sideEffects.map((effect) => (
                            <span key={effect} className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">
                              {effect}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pharmacies */}
                    {msg.pharmacies && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          Nearby Pharmacies
                        </div>
                        {msg.pharmacies.map((pharmacy) => (
                          <div key={pharmacy.id} className="glass rounded-xl p-3 flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-foreground truncate">{pharmacy.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{pharmacy.address}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{pharmacy.distance}</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {pharmacy.lat && pharmacy.lng && (
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.lat},${pharmacy.lng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                  title="Get directions"
                                >
                                  <Navigation className="w-4 h-4" />
                                </a>
                              )}
                              <div
                                className={`text-xs font-medium p-2 rounded-lg ${
                                  pharmacy.available ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                                }`}
                              >
                                {pharmacy.available ? "Available" : "Unavailable"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}

              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-warm flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex gap-1 items-center">

                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                      />
                    ))}
                    {slowSearch && (
                      <span className="ml-2 text-muted-foreground text-xs">
                        Search is taking longer than usual, please wait...
                      </span>
                    )}

                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input - only in chat mode */}
      {!showLanding && (
        <div className="shrink-0 pb-6 pt-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(input);
            }}
            className="relative"
          >
            <div className={`rounded-3xl shadow-card flex items-center ${aiEnabled ? "ai-border-glow" : "glass"}`}>
              {HAS_AI_KEY && (
                <button
                  type="button"
                  onClick={() => setAiEnabled(!aiEnabled)}
                  disabled={isLoading}
                  className={`ml-3 mr-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    aiEnabled
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Avicenna</span>
                </button>
              )}
              {/* <Pill className="w-4 h-4 text-muted-foreground ml-2 shrink-0" /> */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search for a medicine..."
                className={`flex-1 bg-transparent px-3 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none ${aiEnabled ? "ai-border-glow rounded-xl" : ""}`}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="mr-2 w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 hover:opacity-90 transition-opacity"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </form>
                    {aiEnabled && currentModel && (
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-muted-foreground">
                Using {currentModel}
              </p>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            {HAS_AI_KEY ? (
              aiEnabled 
                ? "AI Search Active - Not a substitute for medical advice" 
                : "Database Search"
            ) : (
              "Database Search"
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default MedicineSearch;
