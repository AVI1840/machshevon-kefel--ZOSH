import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { FeedbackModal } from "@/components/FeedbackModal";

const queryClient = new QueryClient();

const LAST_UPDATED = "07.06.2026";

const App = () => {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename="/machshevon-kefel--ZOSH">
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-2">
          <button
            onClick={() => setFeedbackOpen(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-full shadow-lg text-white text-sm font-medium transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: "#1B3A5C" }}
            aria-label="משוב פיילוט"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="hidden sm:inline">משוב פיילוט</span>
          </button>
          <span className="text-[10px] text-gray-400 mr-1">עודכן: {LAST_UPDATED}</span>
        </div>
        <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
