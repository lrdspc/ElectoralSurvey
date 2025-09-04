import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from '@/react-app/contexts/NotificationContext';
import { useUserProfile } from '@/react-app/hooks/useUserProfile';
import OfflineIndicator from '@/react-app/components/OfflineIndicator';
import HomePage from "@/react-app/pages/Home";
import AuthCallback from "@/react-app/components/AuthCallback";
import ProfileSetup from "@/react-app/components/ProfileSetup";
import AdminDashboard from "@/react-app/pages/AdminDashboard";
import InterviewerDashboard from "@/react-app/pages/InterviewerDashboard";
import CreateSurvey from "@/react-app/pages/CreateSurvey";
import SurveyDetails from "@/react-app/pages/SurveyDetails";
import ConductInterview from "@/react-app/pages/ConductInterview";
import SurveyReports from "@/react-app/pages/SurveyReports";
import EditSurvey from "@/react-app/pages/EditSurvey";
import UserManagement from "@/react-app/pages/UserManagement";
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, isPending } = useAuth();
  const { profile, isLoading } = useUserProfile();

  if (isPending || (user && isLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="animate-spin mb-4">
            <Loader2 className="w-8 h-8 mx-auto text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Carregando...</h2>
          <p className="text-gray-600">Preparando o sistema para você.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={!user ? <HomePage /> : <Navigate to={getDefaultRoute(profile)} />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {user && !profile && (
          <Route path="/profile-setup" element={<ProfileSetup />} />
        )}
        
        {user && profile && (
          <>
            {profile.role === 'admin' && (
              <>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/surveys/create" element={<CreateSurvey />} />
                <Route path="/admin/surveys/:id" element={<SurveyDetails />} />
                <Route path="/admin/surveys/:id/edit" element={<EditSurvey />} />
                <Route path="/admin/surveys/:id/reports" element={<SurveyReports />} />
                <Route path="/admin/users" element={<UserManagement />} />
              </>
            )}
            
            {profile.role === 'interviewer' && (
              <>
                <Route path="/interviewer/dashboard" element={<InterviewerDashboard />} />
                <Route path="/interviewer/surveys/:id/interview" element={<ConductInterview />} />
              </>
            )}
          </>
        )}
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      
      {/* Offline Indicator - shown globally when user is logged in */}
      {user && <OfflineIndicator position="bottom-right" showDetails={true} autoHide={true} />}
    </>
  );
}

function getDefaultRoute(profile: any) {
  if (!profile) return '/profile-setup';
  return profile.role === 'admin' ? '/admin/dashboard' : '/interviewer/dashboard';
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <AppContent />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}
