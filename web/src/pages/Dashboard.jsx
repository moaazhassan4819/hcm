import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => setStats(res.data.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center mt-2">Loading dashboard...</div>;
  if (!stats) return <div>Failed to load stats</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Welcome, {user?.name} 👋</h1>
      </div>

      <div className="stats-grid">
        {(user.role === "admin" || user.role === "hr") && (
          <>
            <div className="stat-card primary">
              <div className="label">Total Employees</div>
              <div className="value">{stats.totalEmployees}</div>
            </div>
            <div className="stat-card">
              <div className="label">Departments</div>
              <div className="value">{stats.totalDepartments}</div>
            </div>
            <div className="stat-card success">
              <div className="label">Present Today</div>
              <div className="value">{stats.today.present}</div>
            </div>
            <div className="stat-card warning">
              <div className="label">Late Today</div>
              <div className="value">{stats.today.late}</div>
            </div>
            <div className="stat-card danger">
              <div className="label">Absent Today</div>
              <div className="value">{stats.today.absent}</div>
            </div>
            <div className="stat-card">
              <div className="label">On Leave</div>
              <div className="value">{stats.today.onLeave}</div>
            </div>
            <div className="stat-card warning">
              <div className="label">Pending Leaves</div>
              <div className="value">{stats.pendingLeaves}</div>
            </div>
            <div className="stat-card">
              <div className="label">Draft Payrolls</div>
              <div className="value">{stats.draftPayrolls}</div>
            </div>
          </>
        )}

        {user.role === "employee" && stats.myStats && (
          <>
            <div className="stat-card primary">
              <div className="label">Today Status</div>
              <div className="value" style={{ fontSize: "1.3rem", textTransform: "capitalize" }}>
                {stats.myStats.todayStatus.replace("-", " ")}
              </div>
            </div>
            <div className="stat-card">
              <div className="label">Pending Leaves</div>
              <div className="value">{stats.myStats.pendingLeaves}</div>
            </div>
            <div className="stat-card success">
              <div className="label">Annual Balance</div>
              <div className="value">{stats.myStats.leaveBalances?.annual ?? "-"}</div>
            </div>
            <div className="stat-card">
              <div className="label">Sick Balance</div>
              <div className="value">{stats.myStats.leaveBalances?.sick ?? "-"}</div>
            </div>
          </>
        )}
      </div>

      {user.role === "employee" && (
        <div className="card mt-2">
          <h3 style={{ marginBottom: "1rem" }}>Quick Actions</h3>
          <p className="text-muted">
            Go to <strong>Attendance</strong> to check-in / check-out, or{" "}
            <strong>Leaves</strong> to apply for leave.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
