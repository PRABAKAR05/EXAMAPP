import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './context/ThemeProvider';
import { lazy, Suspense } from 'react';

// Lazy Load Pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ClassManagementPage = lazy(() => import('./pages/admin/ClassManagementPage'));
const ClassDetailPage = lazy(() => import('./pages/admin/ClassDetailPage'));

// Teacher Pages
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const CreateExamPage = lazy(() => import('./pages/teacher/CreateExamPage'));
const ExamDetailPage = lazy(() => import('./pages/teacher/ExamDetailPage'));
const ExamResultsPage = lazy(() => import('./pages/teacher/ExamResultsPage'));

// Student Pages
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const ExamInterface = lazy(() => import('./pages/student/ExamInterface'));
const StudentResultPage = lazy(() => import('./pages/student/StudentResultPage'));

const Unauthorized = () => <div className="p-8 text-2xl text-red-500">Unauthorized Access</div>;

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'student']} />}>
                 <Route path="/change-password" element={<ChangePasswordPage />} />
              </Route>
              
              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/classes" element={<ClassManagementPage />} />
                <Route path="/admin/classes/:id" element={<ClassDetailPage />} />
              </Route>

              {/* Teacher Routes */}
              <Route element={<ProtectedRoute allowedRoles={['teacher', 'admin']} />}>
                <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                <Route path="/teacher/exams/create" element={<CreateExamPage />} />
                <Route path="/teacher/exams/:id" element={<ExamDetailPage />} />
                <Route path="/teacher/exams/:id/results" element={<ExamResultsPage />} />
              </Route>

              {/* Student Routes */}
              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/exam/:id" element={<ExamInterface />} />
                <Route path="/student/exam/:id/result" element={<StudentResultPage />} />
              </Route>

              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
