import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { supabaseError } from "@/lib/supabaseClient";

// Páginas
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewPatientForm from "./pages/NewPatientForm";
import PublicForm from "./pages/PublicForm";
import AppointmentCalendar from "./pages/AppointmentCalendar";
import SEOSettings from "./pages/SEOSettings";
import Notifications from "./pages/Notifications";
import PatientDetails from "./pages/PatientDetails";
import NotFound from "./pages/NotFound";
import ConfigurationError from "./pages/ConfigurationError";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

const App = () => {
  if (supabaseError) {
    return <ConfigurationError error={supabaseError} />;
  }

  return (
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
                    path="/admin/patient/:id" 
                    element={
                      <ProtectedRoute>
                        <PatientDetails />
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
                    path="/admin/notifications" 
                    element={
                      <ProtectedRoute>
                        <Notifications />
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
                  
                  {/* Redirecionamentos */}
                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                  
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
};

export default App;