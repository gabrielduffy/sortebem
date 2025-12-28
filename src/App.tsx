import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CardView from "./pages/CardView";
import TVMode from "./pages/TVMode";
import Checkout from "./pages/Checkout";
import Redeem from "./pages/Redeem";
import HowItWorks from "./pages/HowItWorks";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/c/:codigo" element={<CardView />} />
          <Route path="/tv/:slugEstabelecimento" element={<TVMode />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/resgatar" element={<Redeem />} />
          <Route path="/como-funciona" element={<HowItWorks />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
