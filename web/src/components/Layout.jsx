import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const links = [
    { to: "/", label: "Dashboard", roles: ["admin", "hr", "employee"] },
    { to: "/employees", label: "Employees", roles: ["admin", "hr"] },
    { to: "/attendance", label: "Attendance", roles: ["admin", "hr", "employee"] },
    { to: "/leaves", label: "Leaves", roles: ["admin", "hr", "employee"] },
    { to: "/payroll", label: "Payroll", roles: ["admin", "hr", "employee"] },
    { to: "/company", label: "Company Settings", roles: ["admin", "hr"] },
    { to: "/ai", label: "AI Assistant", roles: ["admin", "hr", "employee"] },
  ];

  const visibleLinks = links.filter((l) => l.roles.includes(user?.role));

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span>🏢</span> HCM Lite
        </div>
        <nav className="sidebar-nav">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            <strong>{user?.name}</strong>
            <div className="text-muted" style={{ color: "#a5b4fc" }}>
              {user?.role?.toUpperCase()}
            </div>
          </div>
          <button className="btn btn-outline w-full" onClick={handleLogout} style={{ color: "#e0e7ff", borderColor: "rgba(255,255,255,0.3)" }}>
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
