import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, Pill, MapPin, AlertTriangle, Sparkles, Bot, User, Menu } from "lucide-react";
import logo from "@/assets/logo.jpg";
import SearchHistory from "./SearchHistory";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  pharmacies?: Pharmacy[];
  sideEffects?: string[];
}

interface Pharmacy {
  name: string;
  address: string;
  distance: string;
  available: boolean;
  price: string;
}

const MOCK_PHARMACIES: Pharmacy[] = [
  { name: "Pharmacie Centrale", address: "12 Rue Didouche Mourad, Alger", distance: "0.3 km", available: true, price: "450 DZD" },
  { name: "Pharmacie El Amel", address: "45 Bd Mohamed V, Oran", distance: "1.2 km", available: true, price: "480 DZD" },
  { name: "Pharmacie du Quartier", address: "8 Rue Ben M'hidi, Constantine", distance: "2.5 km", available: false, price: "460 DZD" },
];

const MOCK_RESPONSES: Record<string, { text: string; sideEffects: string[] }> = {
  default: {
    text: "I found information about this medication. Here are the pharmacies where it may be available, along with potential side effects to be aware of.",
    sideEffects: ["Nausea", "Headache", "Dizziness", "Fatigue", "Dry mouth"],
  },
};

const MedicineSearch = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem("search-history");
    return saved ? JSON.parse(saved) : [];
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // Simulate AI response
    await new Promise((r) => setTimeout(r, 1500));

    const response = MOCK_RESPONSES.default;
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: `**${query}** — ${response.text}`,
      pharmacies: MOCK_PHARMACIES,
      sideEffects: response.sideEffects,
    };
    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const suggestions = [
    "Doliprane 1000mg",
    "Amoxicilline 500mg",
    "Oméprazole 20mg",
    "Vitamine D3",
  ];

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto px-4">
      {/* Header */}
      <header className="flex items-center gap-3 py-4 shrink-0">
        <img src={logo} alt="Espoir DZ" className="w-9 h-9 rounded-xl" />
        <h1 className="text-lg font-bold text-foreground">
          Espoir <span className="text-gradient">DZ</span>
        </h1>
      </header>

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
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Avicenna Agent
                </h2>
                <p className="text-muted-foreground text-sm max-w-md">
                  Search for any medicine — find availability in nearby pharmacies and learn about side effects.
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
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 pt-4"
            >
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
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Side Effects */}
                    {msg.sideEffects && (
                      <div className="glass rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
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
                          <div key={pharmacy.name} className="glass rounded-xl p-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{pharmacy.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{pharmacy.address}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{pharmacy.distance}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                pharmacy.available
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-600"
                              }`}>
                                {pharmacy.available ? "In Stock" : "Unavailable"}
                              </div>
                              {pharmacy.available && (
                                <div className="text-xs font-semibold text-foreground mt-1">{pharmacy.price}</div>
                              )}
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
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-warm flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="shrink-0 pb-6 pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(input);
          }}
          className="relative"
        >
          <div className="glass rounded-2xl shadow-card flex items-center">
            <Pill className="w-4 h-4 text-muted-foreground ml-4 shrink-0" />
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
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Powered by Avicenna AI · Not a substitute for medical advice
        </p>
      </div>
    </div>
  );
};

export default MedicineSearch;
