import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const Login = lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const Budgets = lazy(() => import('./pages/Budgets').then((module) => ({ default: module.Budgets })));
const BudgetCreate = lazy(() => import('./pages/BudgetCreate').then((module) => ({ default: module.BudgetCreate })));
const BudgetDetail = lazy(() => import('./pages/BudgetDetail').then((module) => ({ default: module.BudgetDetail })));
const Templates = lazy(() => import('./pages/Templates').then((module) => ({ default: module.Templates })));
const PriceList = lazy(() => import('./pages/PriceList').then((module) => ({ default: module.PriceList })));
const ProposalPublic = lazy(() => import('./pages/ProposalPublic').then((module) => ({ default: module.ProposalPublic })));

function ScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sim-black">
      <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <ScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<ScreenLoader />}>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/proposal/:slug" element={<ProposalPublic />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/budgets" element={<PrivateRoute><Budgets /></PrivateRoute>} />
        <Route path="/budgets/new" element={<PrivateRoute><BudgetCreate /></PrivateRoute>} />
        <Route path="/budgets/:id" element={<PrivateRoute><BudgetDetail /></PrivateRoute>} />
        <Route path="/templates" element={<PrivateRoute><Templates /></PrivateRoute>} />
        <Route path="/price-list" element={<PrivateRoute><PriceList /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
