import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, Pill, MapPin, Bot, Sparkles } from "lucide-react";
import { GradientText } from "@/components/animate-ui/primitives/texts/gradient";
import BubbleBackground from "@/components/BubbleBackground";
import logo from "@/assets/logo.jpg";
import Header from "@/components/layouts/Header";
import { useState } from "react";

// const features = [
const features = [
  {
    icon: Pill,
    title: "Medicine Search",
    description: "Find any medicine instantly across Algeria's pharmacy network.",
  },
  {
    icon: MapPin,
    title: "Pharmacy Locator",
    description: "Discover nearby pharmacies that have your medicine in stock.",
  },
  {
    icon: Bot,
    title: "AI Insights",
    description: "Get in-depth AI-powered information about any medicine.",
  },
];

const Home = () => {
const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <BubbleBackground />
      <div className="min-h-screen flex flex-col max-w-3xl mx-auto px-4">
        {/* Header */}
        {/* <header className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Espoir DZ" className="w-9 h-9 rounded-xl" />
            <h1 className="text-lg font-bold text-foreground flex items-center gap-1.5">
              Espoir <span className="text-gradient">AI</span>
              <span className="text-[10px] font-medium text-blue-500 bg-blue-500/10 px-1.5  rounded-lg">Beta</span>
            </h1>
          </div>
        </header> */}
        <Header setSidebarOpen={() => setSidebarOpen(true)} hasSideBar={false} />
        {/* Hero */}
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
            <GradientText text="Avicenna" neon className="text-4xl font-extrabold" /> 
            <span className="text-[10px] font-medium text-blue-500 bg-blue-500/10 px-1.5 rounded-lg">Beta</span>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
              Your AI-powered medicine assistant. Find availability, locate pharmacies, and stay informed — all in one place.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link
              to="/search"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-base shadow-glow hover:opacity-90 transition-opacity"
            >
              <Search className="w-5 h-5" />
              Start Searching
            </Link>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 max-w-2xl w-full"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="glass rounded-2xl p-5 text-center space-y-2"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mx-auto">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="py-4 text-center">
          <p className="text-[10px] text-muted-foreground">
            Powered by Espoir AI — Not a substitute for medical advice
          </p>
        </footer>
      </div>
    </>
  );
};

export default Home;
