import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminRoute } from "./components/auth/AdminRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Fretes from "./pages/Fretes";
import FreteFormPage from "./pages/FreteForm";
import Cargas from "./pages/Cargas";
import Produtores from "./pages/Produtores";
import Firmas from "./pages/Firmas";
import ProdutorFormPage from "./pages/ProdutorForm";
import Produtos from "./pages/Produtos";
import ProdutoFormPage from "./pages/ProdutoForm";
import Embalagens from "./pages/Embalagens";
import EmbalagemFormPage from "./pages/EmbalagemForm";
import VendaEmbalagemFormPage from "./pages/VendaEmbalagemForm";
import Relatorios from "./pages/Relatorios";
import Servicos from "./pages/Servicos";
import Frota from "./pages/Frota";
import VeiculoFormPage from "./pages/VeiculoForm";
import Manutencoes from "./pages/Manutencoes";
import TipoManutencaoFormPage from "./pages/TipoManutencaoForm";
import ManutencaoRealizadaFormPage from "./pages/ManutencaoRealizadaForm";
import ListaPrecos from "./pages/ListaPrecos";
import Usuarios from "./pages/Usuarios";
import Perfis from "./pages/Perfis";
import Auditoria from "./pages/Auditoria";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/fretes" element={<Fretes />} />
            <Route path="/cargas" element={<Cargas />} />
            <Route path="/fretes/new" element={<FreteFormPage />} />
            <Route path="/produtores" element={<Produtores />} />
            <Route path="/firmas" element={<Firmas />} />
            <Route path="/lista-precos" element={<ListaPrecos />} />
            <Route path="/produtores/new" element={<ProdutorFormPage />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/produtos/new" element={<ProdutoFormPage />} />
            <Route path="/embalagens" element={<Embalagens />} />
            <Route path="/embalagens/cadastro" element={<EmbalagemFormPage />} />
            <Route path="/embalagens/new" element={<VendaEmbalagemFormPage />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/servicos" element={<Servicos />} />
            <Route path="/frota" element={<Frota />} />
            <Route path="/frota/new" element={<VeiculoFormPage />} />
            <Route path="/manutencoes" element={<Manutencoes />} />
            <Route path="/manutencoes/tipos/new" element={<TipoManutencaoFormPage />} />
            <Route path="/manutencoes/new" element={<ManutencaoRealizadaFormPage />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/usuarios" element={<AdminRoute><Usuarios /></AdminRoute>} />
            <Route path="/perfis" element={<AdminRoute><Perfis /></AdminRoute>} />
            <Route path="/auditoria" element={<AdminRoute><Auditoria /></AdminRoute>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
