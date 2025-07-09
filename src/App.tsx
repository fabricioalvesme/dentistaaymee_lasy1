import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Páginas
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewPatientForm from "./pages/NewPatientForm";
import PublicForm from "./pages/PublicForm";
import AppointmentCalendar from "./pages/AppointmentCalendar";
import SEOSettings from "./pages/SEOSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Páginas públicas */}
                <Route path="/" element={<Index />} />
                <Route path="/admin/login" element={<Login />} />
                <Route path="/public/form" element={<PublicForm />} />
                
                {/* Páginas administrativas protegidas */}
                <Route 
                  path="/admin/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/forms/new" 
                  element={
                    <ProtectedRoute>
                      <NewPatientForm />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/forms/edit/:id" 
                  element={
                    <ProtectedRoute>
                      <NewPatientForm />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/agenda" 
                  element={
                    <ProtectedRoute>
                      <AppointmentCalendar />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/seo" 
                  element={
                    <ProtectedRoute>
                      <SEOSettings />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Rota 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;