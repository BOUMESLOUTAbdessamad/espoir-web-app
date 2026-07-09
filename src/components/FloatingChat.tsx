import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Sparkles, X, Minus, MapPin, Navigation, Copy, Check } from "lucide-react";
import { Medicine, Pharmacy, Message, PharmacyApiResponse } from "@/Types/MainTypes";
import { chatWithAI, ChatMessage, GROQ_MODELS } from "@/services/openrouter";
import SearchInput from "./SearchInput";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:5000/api/v1").replace(/\/$/, "");
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const HAS_AI_KEY = Boolean(OPENROUTER_API_KEY);

const MOCK_RESPONSES: Record<string, { text: string }> = {
  default: {
    text: "I found information about this medication. Here are the pharmacies where it may be available.",
  },
};

const getMedicinesFromPayload = (payload: unknown): Medicine[] => {
  if (Array.isArray(payload)) return payload as Medicine[];
  if (!payload || typeof payload !== "object") return [];
  const typed = payload as Record<string, unknown>;
  if (Array.isArray(typed.medicines)) return typed.medicines as Medicine[];
  if (Array.isArray(typed.data)) return typed.data as Medicine[];
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
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const encoded = encodeURIComponent(trimmed);
  const url = `${API_BASE_URL}/medicines?q=${encoded}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch");
    const payload = (await res.json()) as unknown;
    const medicines = getMedicinesFromPayload(payload);
    const exact = medicines.find((med) => {
      const values = [med.mark, med.dci, med.name].filter(Boolean).map((v) => String(v).toLowerCase());
      return values.includes(trimmed.toLowerCase());
    });
    const partial = medicines.find((med) => {
      const values = [med.mark, med.dci, med.name].filter(Boolean).map((v) => String(v).toLowerCase());
      return values.some((v) => v.includes(trimmed.toLowerCase()));
    });
    const found = exact ?? partial ?? medicines[0];
    if (found?.id) return found.id;
  } catch {
    // ignore
  }
  return null;
};

const findAllMedicines = async (query: string): Promise<Medicine[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];
  if (/^\d+$/.test(trimmed)) {
    try {
      const res = await fetch(`${API_BASE_URL}/medicines/${Number(trimmed)}`);
      if (res.ok) {
        const payload = (await res.json()) as unknown;
        const med = payload as Medicine;
        return med.id ? [med] : [];
      }
    } catch {
    // ignore
  }
    return [];
  }
  const encoded = encodeURIComponent(trimmed);
  try {
    const res = await fetch(`${API_BASE_URL}/medicines?q=${encoded}`);
    if (!res.ok) return [];
    const payload = (await res.json()) as unknown;
    const medicines = getMedicinesFromPayload(payload);
    const exact = medicines.filter((med) => {
      const values = [med.mark, med.dci, med.name].filter(Boolean).map((v) => String(v).toLowerCase());
      return values.includes(trimmed.toLowerCase());
    });
    if (exact.length > 0) return exact;
    const partial = medicines.filter((med) => {
      const values = [med.mark, med.dci, med.name].filter(Boolean).map((v) => String(v).toLowerCase());
      return values.some((v) => v.includes(trimmed.toLowerCase()));
    });
    return partial;
  } catch { return []; }
};

const StyledResponse = ({ content }: { content: string }) => {
  const renderBold = (text: string, key: number | string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={`${key}-${idx}`} className="font-bold">{part.replace(/\*\*/g, "")}</strong>;
      }
      return <span key={`${key}-${idx}`}>{part}</span>;
    });
  };
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listBuffer: { text: string; isOrdered: boolean }[] = [];
  let listKey = 0;
  const flushList = () => {
    if (listBuffer.length === 0) return null;
    const items = listBuffer;
    listBuffer = [];
    const key = listKey++;
    if (items[0].isOrdered) {
      return (
        <ol key={`ol-${key}`} className="list-decimal list-inside space-y-1.5 my-2 ml-4">
          {items.map((item, idx) => (
            <li key={`${key}-${idx}`} className="text-sm text-foreground leading-relaxed">
              {renderBold(item.text, `${key}-li-${idx}`)}
            </li>
          ))}
        </ol>
      );
    }
    return (
      <ul key={`ul-${key}`} className="list-disc list-inside space-y-1.5 my-2 ml-4">
        {items.map((item, idx) => (
          <li key={`${key}-${idx}`} className="text-sm text-foreground leading-relaxed">
            {renderBold(item.text, `${key}-li-${idx}`)}
          </li>
        ))}
      </ul>
    );
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { const list = flushList(); if (list) elements.push(list); continue; }
    if (/^\d+\.\s/.test(trimmed)) {
      const list = flushList(); if (list) elements.push(list);
      listBuffer = [{ text: trimmed.replace(/^\d+\.\s/, ""), isOrdered: true }];
      while (i + 1 < lines.length && /^\d+\.\s/.test(lines[i + 1].trim())) {
        i++;
        listBuffer.push({ text: lines[i].trim().replace(/^\d+\.\s/, ""), isOrdered: true });
      }
      elements.push(flushList());
    } else if (/^[-*]\s/.test(trimmed)) {
      const list = flushList(); if (list) elements.push(list);
      listBuffer = [{ text: trimmed.replace(/^[-*]\s/, ""), isOrdered: false }];
      while (i + 1 < lines.length && /^[-*]\s/.test(lines[i + 1].trim())) {
        i++;
        listBuffer.push({ text: lines[i].trim().replace(/^[-*]\s/, ""), isOrdered: false });
      }
      elements.push(flushList());
    } else {
      const list = flushList(); if (list) elements.push(list);
      elements.push(
        <p key={`p-${i}`} className="text-sm text-foreground leading-relaxed my-2">
          {renderBold(line, `p-${i}`)}
        </p>
      );
    }
  }
  const list = flushList(); if (list) elements.push(list);
  if (elements.length === 0) return <p className="text-sm text-foreground leading-relaxed">{content}</p>;
  return <div className="space-y-1">{elements}</div>;
};

interface FloatingChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const FloatingChat = ({ isOpen, onClose }: FloatingChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [slowSearch, setSlowSearch] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(GROQ_MODELS[0]);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleCopyMessage = useCallback((msg: Message) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 3000);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAISearch = async (query: string) => {
    setSlowSearch(false);
    const timer = setTimeout(() => setSlowSearch(true), 5000);
    try {
      let searchQuery = query;
      try {
        const extractMessages: ChatMessage[] = [
          { role: "system", content: "Extract the medicine name from the user's query. Return ONLY the exact medicine name, or 'NONE' if no specific medicine is mentioned. Do not include any other text or explanation." },
          { role: "user", content: query },
        ];
        const { content: extractedName } = await chatWithAI(extractMessages, { model: selectedModel });
        if (extractedName && extractedName !== "NONE") {
          searchQuery = extractedName.trim();
        }
      } catch {
        // ignore
      }

      const medicineId = await tryResolveMedicineId(searchQuery);
      let pharmacyData: { pharmacies?: Pharmacy[]; medicineName: string; medicineDCI?: string; medicineMark?: string } | null = null;
      let medicines: Medicine[] = [];

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
          medicines = [{
            id: payload.medicine_id,
            mark: payload.medicine_mark,
            dci: payload.medicine_dci,
            name: payload.medicine_dci || payload.medicine_mark || query,
          }];
        }
      }

      const chatMessages: ChatMessage[] = [
        { role: "system", content: "You are Avicenna, a helpful medical/pharmacy assistant. Keep responses concise and in English. Always remind users to consult healthcare professionals for medical advice." }
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
        chatMessages.push({ role: "user", content: context });
        chatMessages.push({ role: "assistant", content: `I found information for "${pharmacyData.medicineName}". Here are the details:` });
      }

      chatMessages.push({ role: "user", content: query });

      const { content: aiResponse, model } = await chatWithAI(chatMessages, { model: selectedModel });
      setCurrentModel(model);

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: aiResponse,
          pharmacies: pharmacyData?.pharmacies,
          medicines,
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
      clearTimeout(timer);
      setSlowSearch(false);
      setIsLoading(false);
    }
  };

  const handleDbSearch = async (query: string) => {
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const allMedicines = await findAllMedicines(query);
      if (allMedicines.length === 0) {
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", content: `I could not match **${query}** to a medicine in the database.` },
        ]);
        return;
      }

      const firstMedicineId = allMedicines[0].id;
      const res = await fetch(`${API_BASE_URL}/medicines/${firstMedicineId}/pharmacies?limit=5`);
      const payload = (await res.json()) as PharmacyApiResponse | { error?: string };

      let pharmacies: Pharmacy[] = [];
      if (res.ok) {
        const apiPayload = payload as PharmacyApiResponse;
        pharmacies = apiPayload.pharmacies.map(normalizePharmacy);
      }

      const response = MOCK_RESPONSES.default;
      const medicineLabel = allMedicines[0].mark || allMedicines[0].dci || allMedicines[0].name || query;

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: pharmacies.length > 0
            ? `**${medicineLabel}** - ${response.text}`
            : `**${medicineLabel}** - no pharmacy currently has this medicine listed as available.`,
          pharmacies,
          medicines: allMedicines,
        },
      ]);
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

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    const userMessage: Message = { id: Date.now().toString(), role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    if (aiEnabled && HAS_AI_KEY) {
      await handleAISearch(query);
    } else {
      await handleDbSearch(query);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          layout
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-4 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-background border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "min(600px, calc(100vh - 1rem))" }}
        >
          {/* Header */}
          <div className={`flex items-center gap-2 px-4 py-3 border-b shrink-0 ${!isMinimized ? "bg-gradient-to-r from-primary/10 to-primary/5" : "bg-primary"}`}>
            <div className="w-6 h-6 rounded-lg bg-gradient-warm flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className={`text-sm font-semibold flex-1 ${isMinimized ? "text-white" : ""}`}>Avicenna AI</span>
            {isMinimized ? (
              <button
                onClick={() => setIsMinimized(false)}
                className="w-6 h-6 rounded-lg hover:bg-primary/10 flex items-center justify-center transition-colors"
              >
                <Sparkles className={`w-3.5 h-3.5 text-muted-foreground ${isMinimized ? "text-white" : ""}`} />
              </button>
            ) : (
              <button
                onClick={() => setIsMinimized(true)}
                className="w-6 h-6 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
              >
                <Minus className={`w-3.5 h-3.5 text-muted-foreground `} />
              </button>
            )}
            <button
              onClick={onClose}
              className={`w-6 h-6 rounded-lg hover:bg-muted flex items-center justify-center transition-colors ${isMinimized ? "text-white" : ""}`}
            >
              <X className={`w-3.5 h-3.5 text-muted-foreground ${isMinimized ? "text-white" : ""}`} />
            </button>
          </div>

          <AnimatePresence initial={false}>
            {!isMinimized && (
              <motion.div
                key="content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                {/* Messages */}
                <div className="overflow-y-auto px-4 py-3 space-y-4" style={{ maxHeight: 400 }}>
                  {messages.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-8">
                      <div className="w-10 h-10 rounded-xl bg-gradient-warm flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground max-w-[200px]">
                        Ask about any medicine — I'll find availability and info for you.
                      </p>
                    </div>
                  )}

                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-6 h-6 rounded-lg bg-gradient-warm flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                      )}
                      <div className={`max-w-[85%] space-y-2 ${msg.role === "user" ? "order-first" : ""}`}>
                        {msg.role === "assistant" ? (
                          <div className="bg-muted rounded-2xl rounded-bl-md overflow-hidden">
                            <div className="p-3 space-y-2">
                              <StyledResponse content={msg.content} />
                              <div className="pt-1.5 mt-2 border-t border-primary/10">
                                <div className="flex items-center justify-between">
                                  <p className="text-[10px] text-muted-foreground italic">
                                    * Consult a professional
                                  </p>
                                  <button
                                    onClick={() => handleCopyMessage(msg)}
                                    className="flex items-center justify-center w-6 h-6 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                  >
                                    {copiedId === msg.id ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-3 py-2 text-sm leading-relaxed">
                            {msg.content}
                          </div>
                        )}

                        {msg.medicines && (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                              <Sparkles className="w-3 h-3 text-primary" />
                              Medicines Found
                            </div>
                            {msg.medicines.map((medicine) => (
                              <div key={medicine.id} className="glass rounded-xl p-2.5 flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-medium text-foreground truncate">{medicine.mark || medicine.name || "Unknown"}</div>
                                  <div className="text-[10px] text-muted-foreground truncate">DCI: {medicine.dci || "N/A"}</div>
                                  <div className="text-[10px] text-muted-foreground">Dosage: {medicine.dosage || "N/A"}</div>
                                </div>
                                <div className="text-[10px] font-medium p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                                  #{medicine.id}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {msg.pharmacies && (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                              <MapPin className="w-3 h-3 text-primary" />
                              Available Pharmacies
                            </div>
                            {msg.pharmacies.map((pharmacy) => (
                              <div key={pharmacy.id} className="glass rounded-xl p-2.5 flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-medium text-foreground truncate">{pharmacy.name}</div>
                                  <div className="text-[10px] text-muted-foreground truncate">{pharmacy.address}</div>
                                  <div className="text-[10px] text-muted-foreground">{pharmacy.distance}</div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {pharmacy.lat && pharmacy.lng && (
                                    <a
                                      href={`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.lat},${pharmacy.lng}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                      title="Get directions"
                                    >
                                      <Navigation className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  <div className={`text-[10px] font-medium p-1.5 rounded-lg ${pharmacy.available ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                                    {pharmacy.available ? "Available" : "Unavailable"}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-3 h-3 text-muted-foreground" />
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-warm flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2 flex gap-1 items-center">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                          />
                        ))}
                        {slowSearch && (
                          <span className="ml-2 text-muted-foreground text-[10px]">
                            Taking longer than usual...
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="shrink-0 px-3 py-2 border-t">
                  <SearchInput
                    value={input}
                    onChange={setInput}
                    onSubmit={() => handleSearch(input)}
                    placeholder="Ask about a medicine..."
                    isLoading={isLoading}
                    aiEnabled={aiEnabled}
                    onAiEnabledChange={setAiEnabled}
                    selectedModel={selectedModel}
                    onSelectedModelChange={setSelectedModel}
                    hasAiKey={HAS_AI_KEY}
                  />
                  {aiEnabled && currentModel && (
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-[9px] text-muted-foreground">
                        Using {currentModel}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingChat;
