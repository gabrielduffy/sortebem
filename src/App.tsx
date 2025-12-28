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
// Establishment
import EstablishmentLogin from "./pages/establishment/EstablishmentLogin";
import EstablishmentDashboard from "./pages/establishment/EstablishmentDashboard";
import EstablishmentSales from "./pages/establishment/EstablishmentSales";
import EstablishmentFinance from "./pages/establishment/EstablishmentFinance";
import EstablishmentPOS from "./pages/establishment/EstablishmentPOS";
import EstablishmentProfile from "./pages/establishment/EstablishmentProfile";
// Manager
import ManagerLogin from "./pages/manager/ManagerLogin";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
// Admin
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Index />} />
          <Route path="/c/:codigo" element={<CardView />} />
          <Route path="/tv/:slugEstabelecimento" element={<TVMode />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/resgatar" element={<Redeem />} />
          <Route path="/como-funciona" element={<HowItWorks />} />
          {/* Establishment */}
          <Route path="/estabelecimento/login" element={<EstablishmentLogin />} />
          <Route path="/estabelecimento" element={<EstablishmentDashboard />} />
          <Route path="/estabelecimento/vendas" element={<EstablishmentSales />} />
          <Route path="/estabelecimento/financeiro" element={<EstablishmentFinance />} />
          <Route path="/estabelecimento/pos" element={<EstablishmentPOS />} />
          <Route path="/estabelecimento/modo-tv" element={<TVMode />} />
          <Route path="/estabelecimento/perfil" element={<EstablishmentProfile />} />
          {/* Manager */}
          <Route path="/gerente/login" element={<ManagerLogin />} />
          <Route path="/gerente" element={<ManagerDashboard />} />
          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
