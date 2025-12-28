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
import ManagerNetwork from "./pages/manager/ManagerNetwork";
import ManagerCommissions from "./pages/manager/ManagerCommissions";
import ManagerRegisterEstablishment from "./pages/manager/ManagerRegisterEstablishment";
import ManagerProfile from "./pages/manager/ManagerProfile";
// Admin
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminDraw from "./pages/admin/AdminDraw";
import AdminCharity from "./pages/admin/AdminCharity";
import AdminRounds from "./pages/admin/AdminRounds";
import AdminManagers from "./pages/admin/AdminManagers";
import AdminEstablishments from "./pages/admin/AdminEstablishments";
import AdminWhatsApp from "./pages/admin/AdminWhatsApp";
import AdminPOS from "./pages/admin/AdminPOS";
import AdminLogs from "./pages/admin/AdminLogs";

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
          <Route path="/gerente/rede" element={<ManagerNetwork />} />
          <Route path="/gerente/comissoes" element={<ManagerCommissions />} />
          <Route path="/gerente/cadastrar" element={<ManagerRegisterEstablishment />} />
          <Route path="/gerente/perfil" element={<ManagerProfile />} />
          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/configuracoes" element={<AdminSettings />} />
          <Route path="/admin/sorteio" element={<AdminDraw />} />
          <Route path="/admin/instituicao" element={<AdminCharity />} />
          <Route path="/admin/rodadas" element={<AdminRounds />} />
          <Route path="/admin/gerentes" element={<AdminManagers />} />
          <Route path="/admin/estabelecimentos" element={<AdminEstablishments />} />
          <Route path="/admin/whatsapp" element={<AdminWhatsApp />} />
          <Route path="/admin/pos" element={<AdminPOS />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
