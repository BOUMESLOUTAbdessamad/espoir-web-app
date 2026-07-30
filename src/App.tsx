import { useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useAuth, useUser } from "@clerk/react";
import { Toaster as Sonner, toast } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import FloatingChat from "@/components/FloatingChat";
import Home from "./pages/Home.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function WelcomeBackNotification() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const prevSignedIn = useRef(isSignedIn);

  useEffect(() => {
    if (isSignedIn && !prevSignedIn.current) {
      toast(`Welcome back, ${user?.firstName || "there"}!`);
    }
    prevSignedIn.current = isSignedIn;
  }, [isSignedIn, user]);

  return null;
}

const App = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* <Toaster  /> */}
        <Sonner className="text-center" expand closeButton />
        <WelcomeBackNotification />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home onToggleChat={() => setIsChatOpen((p) => !p)} />} />
            <Route path="/search" element={<Index onToggleChat={() => setIsChatOpen((p) => !p)} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <FloatingChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
