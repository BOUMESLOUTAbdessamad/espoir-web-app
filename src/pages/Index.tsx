import { motion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import BubbleBackground from "@/components/BubbleBackground";
import Header from "@/components/layouts/Header";

const Index = ({ onToggleChat }: { onToggleChat?: () => void }) => {
  return (
    <>
      <BubbleBackground />
      <div className="min-h-screen flex flex-col max-w-3xl mx-auto px-4">
        <Header setSidebarOpen={() => {}} hasSideBar={false} onToggleChat={onToggleChat} />
        <main className="flex-1 flex flex-col items-center justify-center px-5 text-center gap-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-warm flex items-center justify-center shadow-glow mx-auto">
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-3"
          >
            <h2 className="text-2xl font-bold">
              Medicine Search
            </h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
              Click the sparkle icon in the header to open the AI chat assistant and search for any medicine.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={onToggleChat}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-base shadow-glow hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-5 h-5" />
              Open AI Assistant
            </button>
          </motion.div>
        </main>

        <footer className="py-4 text-center">
          <p className="text-[10px] text-muted-foreground">
            Powered by Espoir AI — Not a substitute for medical advice
          </p>
        </footer>
      </div>
    </>
  );
};

export default Index;
