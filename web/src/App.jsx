import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Setup from "./pages/Setup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Leaves from "./pages/Leaves";
import Payroll from "./pages/Payroll";
import Company from "./pages/Company";
import AIChat from "./pages/AIChat";

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center" style={{ padding: "3rem" }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const PublicOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center" style={{ padding: "3rem" }}>Loading...</div>;
  if (user) return <Navigate to="/" replace />;
  return children;
};

const SetupOrLogin = () => {
  const { isSetup, loading } = useAuth();
  if (loading) return <div className="text-center" style={{ padding: "3rem" }}>Loading...</div>;
  if (isSetup === false) return <Setup />;
  return <Login />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><SetupOrLogin /></PublicOnly>} />
      <Route path="/setup" element={<PublicOnly><Setup /></PublicOnly>} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<PrivateRoute roles={["admin", "hr"]}><Employees /></PrivateRoute>} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leaves" element={<Leaves />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="company" element={<PrivateRoute roles={["admin", "hr"]}><Company /></PrivateRoute>} />
        <Route path="ai" element={<AIChat />} />
      </Route>

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
