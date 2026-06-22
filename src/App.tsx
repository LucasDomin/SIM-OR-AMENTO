import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Budgets } from './pages/Budgets';
import { BudgetCreate } from './pages/BudgetCreate';
import { BudgetDetail } from './pages/BudgetDetail';
import { Templates } from './pages/Templates';
import { PriceList } from './pages/PriceList';
import { ProposalPublic } from './pages/ProposalPublic';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-sim-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/proposal/:slug" element={<ProposalPublic />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/budgets"
        element={
          <PrivateRoute>
            <Budgets />
          </PrivateRoute>
        }
      />
      <Route
        path="/budgets/new"
        element={
          <PrivateRoute>
            <BudgetCreate />
          </PrivateRoute>
        }
      />
      <Route
        path="/budgets/:id"
        element={
          <PrivateRoute>
            <BudgetDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/templates"
        element={
          <PrivateRoute>
            <Templates />
          </PrivateRoute>
        }
      />
      <Route
        path="/price-list"
        element={
          <PrivateRoute>
            <PriceList />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
