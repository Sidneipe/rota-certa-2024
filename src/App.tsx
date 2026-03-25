import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DeliveryProvider } from "@/context/DeliveryContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute, AdminRoute, OperatorRoute, DriverRoute } from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RoutesPage from "./pages/Routes";
import RoutesNewClean from "./pages/RoutesNewClean";
import Planning from "./pages/Planning";
import PlanningNew from "./pages/PlanningNew";
import Bingo from "./pages/Bingo";
import Packages from "./pages/Packages";
import Drivers from "./pages/Drivers";
import History from "./pages/History";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DeliveryProvider>
            <Routes>
              {/* Rotas Públicas */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              
              {/* Rotas Protegidas */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/rotas" element={
                <OperatorRoute>
                  <RoutesPage />
                </OperatorRoute>
              } />
              
              <Route path="/rotas_novo" element={
                <OperatorRoute>
                  <RoutesNewClean />
                </OperatorRoute>
              } />
              
              <Route path="/planejamento" element={
                <OperatorRoute>
                  <Planning />
                </OperatorRoute>
              } />
              
              <Route path="/planejamento_novo" element={
                <OperatorRoute>
                  <PlanningNew />
                </OperatorRoute>
              } />
              
              <Route path="/bingo" element={
                <OperatorRoute>
                  <Bingo />
                </OperatorRoute>
              } />
              
              <Route path="/pacotes" element={
                <OperatorRoute>
                  <Packages />
                </OperatorRoute>
              } />
              
              <Route path="/motoristas" element={
                <OperatorRoute>
                  <Drivers />
                </OperatorRoute>
              } />
              
              <Route path="/historico" element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              } />
              
              <Route path="/usuarios" element={
                <AdminRoute>
                  <Users />
                </AdminRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DeliveryProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
