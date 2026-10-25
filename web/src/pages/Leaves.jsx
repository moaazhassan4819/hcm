import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Leaves = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const load = async () => {
    try {
      const [leavesRes, typesRes] = await Promise.all([
        user.role === "employee"
          ? api.get("/leaves/me")
          : api.get("/leaves"),
        api.get("/company/leave-types"),
      ]);
      setLeaves(leavesRes.data.leaves || []);
      setLeaveTypes(typesRes.data.leaveTypes || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleApply = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/leaves", form);
      setMessage("Leave applied successfully");
      setShowForm(false);
      setForm({ leaveTypeId: "", startDate: "", endDate: "", reason: "" });
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed");
    }
  };

  const handleReview = async (id, status) => {
    try {
      await api.put(`/leaves/${id}/review`, { status });
      setMessage(`Leave ${status}`);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Leave Management</h1>
        {user.role === "employee" && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Apply Leave"}
          </button>
        )}
      </div>

      {message && (
        <div className={`alert ${message.includes("success") || message.includes("applied") || message.includes("approved") ? "alert-success" : "alert-error"}`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="card mb-2">
          <h3 style={{ marginBottom: "1rem" }}>Apply for Leave</h3>
          <form onSubmit={handleApply}>
            <div className="form-group">
              <label>Leave Type</label>
              <select
                className="form-control"
                required
                value={form.leaveTypeId}
                onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
              >
                <option value="">Select...</option>
                {leaveTypes.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.daysAllowed} days)
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  className="form-control"
                  required
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Reason</label>
              <textarea
                className="form-control"
                rows="2"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>
            <button className="btn btn-primary" type="submit">
              Submit Request
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {(user.role === "admin" || user.role === "hr") && <th>Employee</th>}
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">No leave requests</td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l._id}>
                    {(user.role === "admin" || user.role === "hr") && (
                      <td>{l.employee?.name || "-"}</td>
                    )}
                    <td>{l.leaveType?.name}</td>
                    <td>{new Date(l.startDate).toLocaleDateString()}</td>
                    <td>{new Date(l.endDate).toLocaleDateString()}</td>
                    <td>{l.totalDays}</td>
                    <td>
                      <span
                        className={`badge ${
                          l.status === "approved"
                            ? "badge-success"
                            : l.status === "rejected"
                            ? "badge-danger"
                            : l.status === "pending"
                            ? "badge-pending"
                            : "badge-info"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td>
                      {(user.role === "admin" || user.role === "hr") &&
                        l.status === "pending" && (
                          <div className="flex gap-1">
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleReview(l._id, "approved")}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleReview(l._id, "rejected")}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaves;
