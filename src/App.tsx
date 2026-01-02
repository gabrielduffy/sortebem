import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import CardView from "./pages/CardView";
import TVMode from "./pages/TVMode";
import Checkout from "./pages/Checkout";
import Results from "./pages/Results";
import HowItWorks from "./pages/HowItWorks";
import NotFound from "./pages/NotFound";
import SejaParceiro from "./pages/SejaParceiro";
// Demo Pages
import DemoRodada from "./pages/demo/DemoRodada";
import DemoCheckout from "./pages/demo/DemoCheckout";
import DemoCartela from "./pages/demo/DemoCartela";
import DemoResgate from "./pages/demo/DemoResgate";
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
import AdminPOS from "./pages/admin/AdminPOS";
import AdminLogs from '@/pages/admin/AdminLogs';
import AdminIntegrations from '@/pages/admin/AdminIntegrations';
import AdminFinance from '@/pages/admin/AdminFinance';
import AdminProfile from '@/pages/admin/AdminProfile';
import AdminPlayers from '@/pages/admin/AdminPlayers';
import AdminWinners from '@/pages/admin/AdminWinners';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/c/:codigo" element={<CardView />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/est/:code" element={<Checkout />} />
            <Route path="/comprar" element={<Checkout />} />
            <Route path="/tv/:code" element={<TVMode />} />
            <Route path="/tv/:slugEstabelecimento" element={<TVMode />} />
            <Route path="/resultados" element={<Results />} />
            <Route path="/como-funciona" element={<HowItWorks />} />
            <Route path="/seja-parceiro" element={<SejaParceiro />} />

            {/* Demo Pages (public) */}
            <Route path="/demo/rodada" element={<DemoRodada />} />
            <Route path="/demo/checkout" element={<DemoCheckout />} />
            <Route path="/demo/cartela" element={<DemoCartela />} />
            <Route path="/demo/resgate" element={<DemoResgate />} />

            {/* Establishment Login (public) */}
            <Route path="/estabelecimento/login" element={<EstablishmentLogin />} />
            {/* Establishment Protected Routes */}
            <Route path="/estabelecimento" element={
              <ProtectedRoute allowedRoles={['establishment']}>
                <EstablishmentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/estabelecimento/vendas" element={
              <ProtectedRoute allowedRoles={['establishment']}>
                <EstablishmentSales />
              </ProtectedRoute>
            } />
            <Route path="/estabelecimento/financeiro" element={
              <ProtectedRoute allowedRoles={['establishment']}>
                <EstablishmentFinance />
              </ProtectedRoute>
            } />
            <Route path="/estabelecimento/pos" element={
              <ProtectedRoute allowedRoles={['establishment']}>
                <EstablishmentPOS />
              </ProtectedRoute>
            } />
            <Route path="/estabelecimento/modo-tv" element={
              <ProtectedRoute allowedRoles={['establishment']}>
                <TVMode />
              </ProtectedRoute>
            } />
            <Route path="/estabelecimento/perfil" element={
              <ProtectedRoute allowedRoles={['establishment']}>
                <EstablishmentProfile />
              </ProtectedRoute>
            } />

            {/* Manager Login (public) */}
            <Route path="/gerente/login" element={<ManagerLogin />} />
            {/* Manager Protected Routes */}
            <Route path="/gerente" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/gerente/rede" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerNetwork />
              </ProtectedRoute>
            } />
            <Route path="/gerente/comissoes" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerCommissions />
              </ProtectedRoute>
            } />
            <Route path="/gerente/cadastrar" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerRegisterEstablishment />
              </ProtectedRoute>
            } />
            <Route path="/gerente/perfil" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerProfile />
              </ProtectedRoute>
            } />

            {/* Admin Login (public) */}
            <Route path="/admin/login" element={<AdminLogin />} />
            {/* Admin Protected Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/financeiro" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminFinance />
              </ProtectedRoute>
            } />
            <Route path="/admin/configuracoes" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSettings />
              </ProtectedRoute>
            } />
            <Route path="/admin/sorteio" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDraw />
              </ProtectedRoute>
            } />
            <Route path="/admin/instituicao" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminCharity />
              </ProtectedRoute>
            } />
            <Route path="/admin/rodadas" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminRounds />
              </ProtectedRoute>
            } />
            <Route path="/admin/gerentes" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminManagers />
              </ProtectedRoute>
            } />
            <Route path="/admin/estabelecimentos" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminEstablishments />
              </ProtectedRoute>
            } />
            <Route path="/admin/pos" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPOS />
              </ProtectedRoute>
            } />
            <Route path="/admin/logs" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLogs />
              </ProtectedRoute>
            } />
            <Route path="/admin/integracoes" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminIntegrations />
              </ProtectedRoute>
            } />
            <Route path="/admin/jogadores" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPlayers />
              </ProtectedRoute>
            } />
            <Route path="/admin/vencedores" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminWinners />
              </ProtectedRoute>
            } />
            <Route path="/admin/perfil" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminProfile />
              </ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
