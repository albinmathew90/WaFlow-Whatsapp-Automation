import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import type { ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import ResetPassword from "./pages/AuthPages/ResetPassword";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import AppLayout from "./layout/AppLayout";
import AdminLayout from "./layout/AdminLayout";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import SettingsPage from "./pages/Admin/SettingsPage";
import UsersPage from "./pages/Admin/UsersPage";
import MediaPage from "./pages/Admin/MediaPage";
import BlogsPage from "./pages/Admin/BlogsPage";
import BlogTopicsPage from "./pages/Admin/BlogTopicsPage";
import HealthMonitor from "./pages/HealthMonitor";
import { CategoriesPage, ContactsPage, SubscribersPage } from "./pages/Admin/PlaceholderPages";
import SEOPage from "./pages/Admin/SEOPage";
import AdminLogin from './pages/Admin/AdminLogin';
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import Contacts from "./pages/Contacts";
import BroadcastsPage from "./pages/Broadcasts";
import ListTemplates from "./pages/Templates/ListTemplates";
import CreateTemplate from "./pages/Templates/CreateTemplate";
import Flows from "./pages/Flows";
import ActivityLog from "./pages/ActivityLog";
import Settings from "./pages/Settings";
import { InboxPage } from "./pages/Inbox";
import { UserProvider, useUser } from "./context/UserContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Applications from './pages/OTPBuilder/Applications';
import DeveloperIntegration from './pages/OTPBuilder/DeveloperIntegration/DeveloperIntegration';
import Templates from './pages/OTPBuilder/Templates';
import TemplateEditor from './pages/OTPBuilder/TemplateEditor';
import ApiKeys from "./pages/OTPBuilder/ApiKeys";
import Webhooks from "./pages/OTPBuilder/Webhooks";
import AnalyticsAndLogs from "./pages/OTPBuilder/AnalyticsAndLogs/AnalyticsAndLogs";
import Chatbot from "./pages/Chatbot/Chatbot";
import ChatbotLeads from "./pages/Chatbot/ChatbotLeads";

// ---- Full-page loading spinner (inline styles so it always renders) ----
function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', height: '100vh', width: '100%',
      alignItems: 'center', justifyContent: 'center',
      background: '#f9fafb', flexDirection: 'column', gap: '16px'
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        border: '4px solid #e5e7eb',
        borderTopColor: '#465fff',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#9ca3af', fontSize: 14 }}>Loading...</p>
    </div>
  );
}

/**
 * ProtectedRoute — wraps authenticated pages.
 * - While the auth context is resolving (verifying the JWT with the server) → show spinner.
 * - If no valid user → redirect to /signin.
 * - Otherwise render the page normally.
 */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useUser();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/signin" replace />;
  return <>{children}</>
}

const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useUser();

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId="623118644403-0ri47l1fu15ndka8nppm09qf3puip9ta.apps.googleusercontent.com">
      <UserProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Protected Dashboard Layout — requires login */}
            <Route
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <AppLayout />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            >
              <Route index path="/" element={<Home />} />
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/broadcasts" element={<BroadcastsPage />} />
              <Route path="/templates">
                <Route index element={<ListTemplates />} />
                <Route path="create" element={<CreateTemplate />} />
              </Route>
              <Route path="/flows" element={<Flows />} />
              <Route path="/activity-log" element={<ActivityLog />} />
              <Route path="/health-monitor" element={<HealthMonitor />} />
              <Route path="/otp-builder">
                <Route path="applications" element={<Applications />} />
                <Route path="applications/:appId/integration" element={<DeveloperIntegration />} />
                <Route path="api-keys" element={<ApiKeys />} />
                <Route path="templates" element={<Templates />} />
                <Route path="templates/create" element={<TemplateEditor />} />
                <Route path="templates/edit/:templateId" element={<TemplateEditor />} />
                <Route path="webhooks" element={<Webhooks />} />
                <Route path="logs" element={<AnalyticsAndLogs />} />
              </Route>
              <Route path="/settings" element={<Navigate to="/settings/account" replace />} />
              <Route path="/settings/account" element={<Settings />} />
              <Route path="/settings/tags" element={<Settings />} />
              <Route path="/settings/media" element={<Settings />} />
              <Route path="/settings/contact-fields" element={<Settings />} />
              <Route path="/chatbot">
                <Route index element={<Chatbot />} />
                <Route path="leads" element={<ChatbotLeads />} />
              </Route>
            </Route>

            {/* Admin Login Route */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin Dashboard Layout */}
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <ErrorBoundary>
                    <AdminLayout />
                  </ErrorBoundary>
                </ProtectedAdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="collections/users" element={<UsersPage />} />
              <Route path="collections/media" element={<MediaPage />} />
              <Route path="collections/blogs" element={<BlogsPage />} />
              <Route path="collections/blog-topics" element={<BlogTopicsPage />} />
              <Route path="collections/case-study-categories" element={<CategoriesPage />} />
              <Route path="collections/seo" element={<SEOPage />} />
              <Route path="collections/contact" element={<ContactsPage />} />
              <Route path="collections/subscriber" element={<SubscribersPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Public Auth pages — redirect to dashboard if already logged in */}
            <Route
              path="/signin"
              element={
                <PublicRoute>
                  <SignIn />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <SignUp />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </UserProvider>
    </GoogleOAuthProvider>
  );
}
