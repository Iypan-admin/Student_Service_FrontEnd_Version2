import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Dashboard from './components/Dashboard';
import Class from './components/Class'; // Import the Class component
import Notes from './components/Notes'; // Import the Notes component 
import Payments from './components/Payments';
import StudentAttendancePage from './pages/StudentAttendancePage';
import StudentLSRWPage from './pages/StudentLSRWPage';
import StudentLSRWReviewPage from './pages/StudentLSRWReviewPage';
import ResultsAndCertificate from './components/ResultsAndCertificate'; // Import ResultsAndCertificate
import Sidebar from './components/parts/Sidebar';
import Classbar from './components/parts/Classbar'; // Import the Sidebar component
import { AuthProvider, useAuth } from './context/AuthContext';
import Chat from './components/Chat';
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ShippingPolicy from './pages/ShippingPolicy';
import RefundCancellationPolicy from './pages/RefundCancellationPolicy';
import ContactUs from './pages/ContactUs';
import EventCalendarPage from './pages/EventCalendarPage';
import NotificationsPage from './pages/NotificationsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};
function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster 
          position="top-right"
          toastOptions={{
            success: {
              duration: 4000,
              style: {
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#ffffff',
                padding: '16px 20px',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
                fontSize: '15px',
                fontWeight: '500',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                minWidth: '300px',
                maxWidth: '500px',
              },
              iconTheme: {
                primary: '#ffffff',
                secondary: '#3b82f6',
              },
            },
            error: {
              duration: 4000,
              style: {
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#ffffff',
                padding: '16px 20px',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)',
                fontSize: '15px',
                fontWeight: '500',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                minWidth: '300px',
                maxWidth: '500px',
              },
              iconTheme: {
                primary: '#ffffff',
                secondary: '#ef4444',
              },
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route path="/refund-cancellation-policy" element={<RefundCancellationPolicy />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/class/:batchId"
            element={
              <ProtectedRoute>
                <div className="flex">
                  <Classbar /> {/* Assuming Classbar is used for Class pages */}
                  <div className="flex-1">
                    <Class />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/class/:batchId/resources"
            element={
              <ProtectedRoute>
                <div className="flex">
                  <Classbar />
                  <div className="flex-1">
                    <Notes />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/class/:batchId/chat"
            element={
              <ProtectedRoute>
                <div className="flex">
                  <Classbar />
                  <div className="flex-1">
                    <Chat />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/class/:batchId/results-certificate"
            element={
              <ProtectedRoute>
                <div className="flex">
                  <Classbar />
                  <div className="flex-1">
                    <ResultsAndCertificate />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/class/:batchId/attendance"
            element={
              <ProtectedRoute>
                <div className="flex">
                  <Classbar />
                  <div className="flex-1">
                    <StudentAttendancePage />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/class/:batchId/lsrw"
            element={
              <ProtectedRoute>
                <div className="flex">
                  <Classbar />
                  <div className="flex-1">
                    <StudentLSRWPage />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/class/:batchId/lsrw/review/:lsrwId"
            element={
              <ProtectedRoute>
                <div className="flex">
                  <Classbar />
                  <div className="flex-1">
                    <StudentLSRWReviewPage />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <div className="flex">
                  <Sidebar />
                  <div className="flex-1">
                    <Payments />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/event-calendar"
            element={
              <ProtectedRoute>
                <EventCalendarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;