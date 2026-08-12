import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import Students from '@/pages/Students';
import Classes from '@/pages/Classes';
import Attendance from '@/pages/Attendance';
import Cash from '@/pages/Cash';
import Savings from '@/pages/Savings';
import Announcements from '@/pages/Announcements';
import UserManagement from '@/pages/UserManagement';
import Account from '@/pages/Account';
import MonthlyReports from '@/pages/MonthlyReports';
import AttendanceAnalytics from '@/pages/AttendanceAnalytics';
import ActivityLogs from '@/pages/ActivityLogs';
import UserVerification from '@/pages/UserVerification';
import RolePermissions from '@/pages/RolePermissions';
import SavingsDetails from '@/pages/SavingsDetails';
import ClassManagement from '@/pages/ClassManagement';
import Teachers from '@/pages/Teachers';
import HelpCenter from '@/pages/HelpCenter';
import NotificationsSettings from '@/pages/NotificationsSettings';
import ArchiveReports from '@/pages/ArchiveReports';
import TransactionHistory from '@/pages/TransactionHistory';
import AnnouncementArchive from '@/pages/AnnouncementArchive';
import AdminSettings from '@/pages/AdminSettings';
import Pembukuan from '@/pages/Pembukuan';
import StudentBarcodes from '@/pages/StudentBarcodes';
import BarcodeScan from '@/pages/BarcodeScan';
import MyBarcode from '@/pages/MyBarcode';
import ExportSourceCode from '@/pages/ExportSourceCode';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/siswa" element={<Students />} />
          <Route path="/kelas" element={<Classes />} />
          <Route path="/absensi" element={<Attendance />} />
          <Route path="/kas" element={<Cash />} />
          <Route path="/tabungan" element={<Savings />} />
          <Route path="/pengumuman" element={<Announcements />} />
          <Route path="/pengguna" element={<UserManagement />} />
          <Route path="/akun" element={<Account />} />
          <Route path="/monthly-reports" element={<MonthlyReports />} />
          <Route path="/attendance-analytics" element={<AttendanceAnalytics />} />
          <Route path="/activity-logs" element={<ActivityLogs />} />
          <Route path="/user-verification" element={<UserVerification />} />
          <Route path="/role-permissions" element={<RolePermissions />} />
          <Route path="/savings-details" element={<SavingsDetails />} />
          <Route path="/class-management" element={<ClassManagement />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/help-center" element={<HelpCenter />} />
          <Route path="/notification-settings" element={<NotificationsSettings />} />
          <Route path="/teacher-management" element={<Teachers />} />
          <Route path="/archive-reports" element={<ArchiveReports />} />
          <Route path="/transaction-history" element={<TransactionHistory />} />
          <Route path="/announcement-archive" element={<AnnouncementArchive />} />
          <Route path="/settings" element={<AdminSettings />} />
          <Route path="/pembukuan" element={<Pembukuan />} />
          <Route path="/student-barcodes" element={<StudentBarcodes />} />
          <Route path="/barcode-scan" element={<BarcodeScan />} />
          <Route path="/my-barcode" element={<MyBarcode />} />
          <Route path="/export-source-code" element={<ExportSourceCode />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App