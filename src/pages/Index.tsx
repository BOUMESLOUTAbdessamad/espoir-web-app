import { useState } from "react";
import { motion } from "framer-motion";
import { Pill, Sparkles, Loader2, BookText } from "lucide-react";
import BubbleBackground from "@/components/BubbleBackground";
import Header from "@/components/layouts/Header";
import { chatWithAI, ChatMessage } from "@/services/openrouter";
import { Medicine } from "@/Types/MainTypes";
import MedicineCard from "@/components/MedicineCard";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api/v1"
).replace(/\/$/, "");
const HAS_AI_KEY = Boolean(
  import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_GROQ_API_KEY,
);

const getMedicinesFromPayload = (payload: unknown): Medicine[] => {
  if (Array.isArray(payload)) return payload as Medicine[];
  if (!payload || typeof payload !== "object") return [];
  const typed = payload as Record<string, unknown>;
  if (Array.isArray(typed.medicines)) return typed.medicines as Medicine[];
  if (Array.isArray(typed.data)) return typed.data as Medicine[];
  return [];
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
      return [];
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
      const v = [med.mark, med.dci, med.name]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase());
      return v.includes(trimmed.toLowerCase());
    });
    if (exact.length > 0) return exact;
    return medicines.filter((med) => {
      const v = [med.mark, med.dci, med.name]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase());
      return v.some((s) => s.includes(trimmed.toLowerCase()));
    });
  } catch {
    return [];
  }
};

const Index = ({ onToggleChat }: { onToggleChat?: () => void }) => {
  const [searchValue, setSearchValue] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [aiOverview, setAiOverview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    const q = searchValue.trim();
    if (!q || isLoading) return;

    setIsLoading(true);
    setAiOverview("");
    setMedicines([]);
    setHasSearched(true);

    try {
      const results = await findAllMedicines(q);
      setMedicines(results);

      if (results.length > 0 && HAS_AI_KEY) {
        const names = results
          .slice(0, 5)
          .map((m) => m.mark || m.name || m.dci || "Unknown")
          .filter(Boolean)
          .join(", ");
        const dcis = results
          .slice(0, 3)
          .map((m) => m.dci)
          .filter(Boolean)
          .join(", ");
        const context = `Search query: "${q}". Found medicines: ${names}.${dcis ? " DCI/INN: " + dcis : ""}. Give an AI Overview.`;
        const messages: ChatMessage[] = [
          {
            role: "system",
            content:
              "You are Avicenna, a helpful medical assistant. Provide a concise, factual AI overview in 2-3 sentences about the medicines found. Use plain English only. Never use markdown. Always remind the user to consult a healthcare professional for medical advice.",
          },
          { role: "user", content: context },
        ];
        const { content } = await chatWithAI(messages);
        setAiOverview(content);
      } else if (results.length > 0) {
        const labels = results
          .slice(0, 5)
          .map((m) => m.mark || m.name || m.dci)
          .filter(Boolean)
          .join(", ");
        setAiOverview(
          `Found ${results.length} medicine(s) matching "${q}". Showing: ${labels}.`,
        );
      } else {
        setAiOverview(`No medicines found for "${q}" in the database.`);
      }
    } catch {
      setAiOverview("An error occurred while searching. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <BubbleBackground />
      <div className="min-h-screen max-w-3xl mx-auto px-4">
        <Header
          setSidebarOpen={() => {}}
          hasSideBar={false}
          onToggleChat={onToggleChat}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onSearchSubmit={handleSearch}
          isSearchLoading={isLoading}
        />
        <main className="pb-8">
          {!hasSearched && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-warm flex flex-col items-center justify-center shadow-glow mb-4">
                <Pill className="w-8 h-8 text-primary-foreground" />
              </div>
              <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
                Search for any medicine in our database. Get comprehensive
                information, availability, and AI-powered insights.
              </p>
            </motion.div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span className="ml-3 text-sm text-muted-foreground">
                Searching...
              </span>
            </div>
          )}

          {!isLoading && aiOverview && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 mb-6 border border-primary/10 bg-gradient-to-r from-primary/5 to-primary/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">AI Overview</h3>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {aiOverview}
              </p>
            </motion.div>
          )}

          {!isLoading && medicines.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <BookText className="w-4 h-4" />
                <span className="text-sm uppercase tracking-wide font-semibold text-muted-foreground">
                  Medicines ({medicines.length})
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {medicines?.map((medicine) => (
                  <MedicineCard {...medicine} />
                ))}
              </div>
            </motion.div>
          )}
        </main>

        <footer className="py-4 text-center shrink-0">
          <p className="text-[10px] text-muted-foreground">
            Powered by Espoir &mdash; Not a substitute for medical advice
          </p>
        </footer>
      </div>
    </>
  );
};

export default Index;
