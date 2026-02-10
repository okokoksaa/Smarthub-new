import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { routePermissions } from "@/config/routePermissions";
import Auth from "@/pages/Auth";
import SmartDashboard from "@/pages/SmartDashboard";
import AIKnowledgeCenter from "@/pages/AIKnowledgeCenter";
import WardIntake from "@/pages/WardIntake";
import CDFCGovernance from "@/pages/CDFCGovernance";
import TACAppraisal from "@/pages/TACAppraisal";
import PLGODashboard from "@/pages/PLGODashboard";
import MinistryDashboard from "@/pages/MinistryDashboard";
import NationalCommandCenter from "@/pages/NationalCommandCenter";
import ProjectLifecycle from "@/pages/ProjectLifecycle";
import ProjectWorkflow from "@/pages/ProjectWorkflow";
import Procurement from "@/pages/Procurement";
import FinancialManagement from "@/pages/FinancialManagement";
import ExpenditureReturns from "@/pages/ExpenditureReturns";
import EmpowermentGrants from "@/pages/EmpowermentGrants";
import BursaryManagement from "@/pages/BursaryManagement";
import Payments from "@/pages/Payments";
import PublicPortal from "@/pages/PublicPortal";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Users from "@/pages/Users";
import AdminControlPanel from "@/pages/AdminControlPanel";
import IntegrationsHub from "@/pages/IntegrationsHub";
import SystemHealth from "@/pages/SystemHealth";
import SecurityCenter from "@/pages/SecurityCenter";
import MonitoringEvaluation from "@/pages/MonitoringEvaluation";
import LegalCompliance from "@/pages/LegalCompliance";
import AuditsInvestigations from "@/pages/AuditsInvestigations";
import NotFound from "@/pages/NotFound";
import VerifyDocument from "@/pages/VerifyDocument";
import AIChat from "@/pages/AIChat";

const queryClient = new QueryClient();

// Helper to get allowed roles for a path
const getRoles = (path: string) => {
  const route = routePermissions.find(r => r.path === path);
  return route?.allowedRoles || [];
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/public-portal" element={<PublicPortal />} />
            <Route path="/verify/:id" element={<VerifyDocument />} />
            
            {/* Protected routes with role-based access */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      {/* Core */}
                      <Route path="/" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/')}>
                          <SmartDashboard />
                        </RoleProtectedRoute>
                      } />
                      <Route path="/ai-knowledge" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/ai-knowledge')}>
                          <AIKnowledgeCenter />
                        </RoleProtectedRoute>
                      } />
                      <Route path="/ai-chat" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/ai-chat')}>
                          <AIChat />
                        </RoleProtectedRoute>
                      } />

                      {/* Community */}
                      <Route path="/ward-intake" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/ward-intake')}>
                          <WardIntake />
                        </RoleProtectedRoute>
                      } />
                      <Route path="/cdfc" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/cdfc')}>
                          <CDFCGovernance />
                        </RoleProtectedRoute>
                      } />
                      <Route path="/tac" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/tac')}>
                          <TACAppraisal />
                        </RoleProtectedRoute>
                      } />
                      
                      {/* Approvals */}
                      <Route path="/plgo" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/plgo')}>
                          <PLGODashboard />
                        </RoleProtectedRoute>
                      } />
                      <Route path="/command-center" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/command-center')}>
                          <NationalCommandCenter />
                        </RoleProtectedRoute>
                      } />
                      <Route path="/ministry" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/ministry')}>
                          <MinistryDashboard />
                        </RoleProtectedRoute>
                      } />
                      
                      {/* Projects & Procurement */}
                      <Route path="/projects" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/projects')}>
                          <ProjectLifecycle />
                        </RoleProtectedRoute>
                      } />
                      <Route path="/project-workflow" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/project-workflow')}>
                          <ProjectWorkflow />
                        </RoleProtectedRoute>
                      } />
                      <Route path="/procurement" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/procurement')}>
                          <Procurement />
                        </RoleProtectedRoute>
                      } />
                      
                      {/* Finance */}
                      <Route path="/financial" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/financial')}>
                          <FinancialManagement />
                        </RoleProtectedRoute>
                      } />
                      <Route path="/expenditure" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/expenditure')}>
                          <ExpenditureReturns />
                        </RoleProtectedRoute>
                      } />
                      <Route path="/payments" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/payments')}>
                          <Payments />
                        </RoleProtectedRoute>
                      } />
                      
                      {/* Programs */}
                      <Route path="/empowerment" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/empowerment')}>
                          <EmpowermentGrants />
                        </RoleProtectedRoute>
                      } />
                      <Route path="/bursaries" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/bursaries')}>
                          <BursaryManagement />
                        </RoleProtectedRoute>
                      } />
                      
                      {/* Oversight */}
                      <Route path="/monitoring" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/monitoring')}>
                          <MonitoringEvaluation />
                        </RoleProtectedRoute>
                      } />
                      <Route path="/legal" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/legal')}>
                          <LegalCompliance />
                        </RoleProtectedRoute>
                      } />
                      <Route path="/audits" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/audits')}>
                          <AuditsInvestigations />
                        </RoleProtectedRoute>
                      } />
                      
                      {/* Administration */}
                      <Route path="/users" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/users')}>
                          <Users />
                        </RoleProtectedRoute>
                      } />
                      <Route path="/admin" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/admin')}>
                          <AdminControlPanel />
                        </RoleProtectedRoute>
                      } />
                      <Route path="/billing" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/billing')}>
                          <Settings />
                        </RoleProtectedRoute>
                      } />
                      
                      {/* System */}
                      <Route path="/integrations" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/integrations')}>
                          <IntegrationsHub />
                        </RoleProtectedRoute>
                      } />
                      <Route path="/reports" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/reports')}>
                          <Reports />
                        </RoleProtectedRoute>
                      } />
                      <Route path="/system-health" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/system-health')}>
                          <SystemHealth />
                        </RoleProtectedRoute>
                      } />
                      <Route path="/security" element={
                        <RoleProtectedRoute allowedRoles={getRoles('/security')}>
                          <SecurityCenter />
                        </RoleProtectedRoute>
                      } />
                      
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;