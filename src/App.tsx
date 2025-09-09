import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TestSelect from "./pages/TestSelect";
import TestStartOld from "./pages/TestStart";
import TestProgress from "./pages/TestProgress";
import DiagnosticSelect from "./pages/DiagnosticSelect";
import Dashboard from "./pages/Dashboard";
import TestGuide from "./pages/TestGuide";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import FAQ from "./pages/FAQ";
import Progress from "./pages/Progress";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StudentsManagement from "./pages/admin/StudentsManagement";
import TeacherManagement from "./pages/admin/TeacherManagement";
import TestsManagement from "./pages/admin/TestsManagement";
import PassagesManagement from "./pages/admin/PassagesManagement";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import UserManagement from "./pages/admin/UserManagement";
import DeploymentManagement from "./pages/admin/DeploymentManagement";
import ReviewResults from "./pages/admin/ReviewResults";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherStudents from "./pages/teacher/TeacherStudents";
import TeacherResults from "./pages/teacher/TeacherResults";
import StudentPermissions from "./pages/admin/StudentPermissions";
import LoginPage from "./pages/LoginPage";
import AuthPage from "./pages/AuthPage";
import AuthTest from "./pages/AuthTest";
import ReadingTest from "./pages/ReadingTest";
import ReadingSelect from "./pages/ReadingSelect";
import SupabaseDiagnostic from "./pages/SupabaseDiagnostic";
import ChangePassword from "./pages/ChangePassword";
import AdminTest from "./pages/AdminTest";
import AdminOverview from "./pages/admin/AdminOverview";
import PermissionsManagement from "./pages/admin/PermissionsManagement";
import PlacementManagement from "./pages/admin/PlacementManagement";
import TeacherLayout from "./components/layout/TeacherLayout";
import TeacherClasses from "./pages/teacher/TeacherClasses";
import TeacherGrading from "./pages/teacher/TeacherGrading";
import TeacherAnalysis from "./pages/teacher/TeacherAnalysis";
import TeacherSettings from "./pages/teacher/TeacherSettings";
import TeacherReview from "./pages/teacher/TeacherReview";
import StudentLayout from "./components/layout/StudentLayout";
import StudentTests from "./pages/student/StudentTests";
import StudentResults from "./pages/student/StudentResults";
import StudentNotifications from "./pages/student/StudentNotifications";
import StudentSettings from "./pages/student/StudentSettings";
import TestStart from "./pages/student/TestStart";
import TeacherQuestionBank from "./pages/teacher/TeacherQuestionBank";
import TeacherOfflineGrading from "./pages/teacher/OfflineGrading";
import StudentTestAttempt from "./pages/StudentTestAttempt";
import StudentTestsPage from "./pages/StudentTests";
import StudentTestAttemptActive from "./pages/StudentTestAttemptActive";
import StudentTestResult from "./pages/StudentTestResult";
import ProctorMonitoring from "./pages/admin/ProctorMonitoring";
import QuestionBankManagement from "./pages/admin/QuestionBankManagement";
import AdminHealth from "./pages/admin/AdminHealth";
import ScoringConfiguration from "./pages/admin/ScoringConfiguration";
import AdminLinks from "./pages/admin/AdminLinks";
import ReleaseChecklist from "./pages/admin/ReleaseChecklist";
import ChangelogManagement from "./pages/admin/ChangelogManagement";
import OfflineUpload from "./pages/OfflineUpload";
import StudentTokenAccess from "./pages/StudentTokenAccess";
import ParentResultView from "./pages/ParentResultView";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/test/guide" element={<TestGuide />} />
              <Route path="/test/select" element={
                <ProtectedRoute>
                  <TestSelect />
                </ProtectedRoute>
              } />
              <Route path="/diagnostic/select" element={
                <ProtectedRoute>
                  <DiagnosticSelect />
                </ProtectedRoute>
              } />
              <Route path="/test/diagnostic" element={
                <ProtectedRoute>
                  <DiagnosticSelect />
                </ProtectedRoute>
              } />
              <Route path="/test/start" element={
                <ProtectedRoute>
                  <TestStartOld />
                </ProtectedRoute>
              } />
              <Route path="/test/progress" element={
                <ProtectedRoute>
                  <TestProgress />
                </ProtectedRoute>
              } />
              <Route path="/progress" element={
                <ProtectedRoute>
                  <Progress />
                </ProtectedRoute>
              } />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/faq" element={<FAQ />} />
              
               {/* Admin Routes - New Simplified Structure */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute requireAdmin>
                  <UserManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/tests" element={
                <ProtectedRoute requireAdmin>
                  <TestsManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/deployment" element={
                <ProtectedRoute requireAdmin>
                  <DeploymentManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/reviews" element={
                <ProtectedRoute requireAdmin>
                  <ReviewResults />
                </ProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedRoute requireAdmin>
                  <AdminSettings />
                </ProtectedRoute>
              } />

              {/* Legacy Route Redirects */}
              <Route path="/admin/overview" element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/students" element={
                <ProtectedRoute requireAdmin>
                  <UserManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/teachers" element={
                <ProtectedRoute requireAdmin>
                  <UserManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/permissions" element={
                <ProtectedRoute requireAdmin>
                  <UserManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/proctor" element={
                <ProtectedRoute requireAdmin>
                  <DeploymentManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/links" element={
                <ProtectedRoute requireAdmin>
                  <DeploymentManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/analytics" element={
                <ProtectedRoute requireAdmin>
                  <ReviewResults />
                </ProtectedRoute>
              } />
              <Route path="/admin/scoring" element={
                <ProtectedRoute requireAdmin>
                  <AdminSettings />
                </ProtectedRoute>
              } />
              <Route path="/admin/placement" element={
                <ProtectedRoute requireAdmin>
                  <AdminSettings />
                </ProtectedRoute>
              } />
              <Route path="/admin/health" element={
                <ProtectedRoute requireAdmin>
                  <AdminSettings />
                </ProtectedRoute>
              } />
              <Route path="/admin/release" element={
                <ProtectedRoute requireAdmin>
                  <AdminSettings />
                </ProtectedRoute>
              } />
              <Route path="/admin/changelog" element={
                <ProtectedRoute requireAdmin>
                  <AdminSettings />
                </ProtectedRoute>
              } />

              {/* Hidden/Direct Access Routes */}
              <Route path="/admin/question-bank" element={
                <ProtectedRoute requireAdmin>
                  <QuestionBankManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/passages" element={
                <ProtectedRoute requireAdmin>
                  <PassagesManagement />
                </ProtectedRoute>
              } />
              
              {/* Teacher Routes */}
              <Route path="/teacher" element={
                <ProtectedRoute requireTeacher>
                  <TeacherLayout />
                </ProtectedRoute>
              }>
                <Route index element={<TeacherClasses />} />
                <Route path="classes" element={<TeacherClasses />} />
                <Route path="grading" element={<TeacherGrading />} />
                <Route path="analysis" element={<TeacherAnalysis />} />
                <Route path="students" element={<TeacherStudents />} />
                <Route path="question-bank" element={<TeacherQuestionBank />} />
                <Route path="review" element={<TeacherReview />} />
                <Route path="offline-grading" element={<TeacherOfflineGrading />} />
              </Route>
              <Route path="/teacher/results" element={
                <ProtectedRoute requireTeacher>
                  <TeacherResults />
                </ProtectedRoute>
              } />

              {/* Student Routes */}
              <Route path="/student" element={
                <ProtectedRoute>
                  <StudentLayout />
                </ProtectedRoute>
              }>
                <Route index element={<StudentTests />} />
                <Route path="tests" element={<StudentTests />} />
                <Route path="results" element={<StudentResults />} />
                <Route path="notifications" element={<StudentNotifications />} />
                <Route path="settings" element={<StudentSettings />} />
              </Route>
              <Route path="/student/tests/start/:id" element={
                <ProtectedRoute>
                  <TestStart />
                </ProtectedRoute>
              } />
              
              {/* Student Tests Routes - New /s routes */}
              <Route path="/s" element={<StudentTestsPage />} />
              <Route path="/s/attempt/:id" element={<StudentTestAttempt />} />
              <Route path="/s/attempt/:id/active" element={<StudentTestAttemptActive />} />
              <Route path="/s/result/:id" element={<StudentTestResult />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth-test" element={<AuthTest />} />
              <Route path="/change-password" element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              } />
              <Route path="/account/password" element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              } />
              
              {/* Reading Routes */}
              <Route path="/reading/select" element={
                <ProtectedRoute>
                  <ReadingSelect />
                </ProtectedRoute>
              } />
              <Route path="/reading-test/:passageId" element={
                <ProtectedRoute>
                  <ReadingTest />
                </ProtectedRoute>
              } />
              
              {/* Admin Test Routes */}
              <Route path="/admin/tests" element={
                <ProtectedRoute>
                  <TestsManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin-test/:masterId/:versionId" element={
                <ProtectedRoute>
                  <AdminTest />
                </ProtectedRoute>
              } />
              <Route path="/admin-test/:masterId/:versionId/:sectionId" element={
                <ProtectedRoute>
                  <AdminTest />
                </ProtectedRoute>
              } />
              
              {/* Student Token Access */}
              <Route path="/s/token/:token" element={<StudentTokenAccess />} />
              
              {/* Parent Result View */}
              <Route path="/r/:token" element={<ParentResultView />} />
              
              {/* Offline Upload Route */}
              <Route path="/u/:token" element={<OfflineUpload />} />
              
              {/* Diagnostic Route */}
              <Route path="/__diag-supabase" element={<SupabaseDiagnostic />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;