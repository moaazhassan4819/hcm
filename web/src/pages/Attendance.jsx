import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Attendance = () => {
  const { user } = useAuth();
  const [today, setToday] = useState(null);
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      if (user.role === "employee") {
        const [todayRes, histRes] = await Promise.all([
          api.get("/attendance/today"),
          api.get("/attendance/me"),
        ]);
        setToday(todayRes.data.attendance);
        setRecords(histRes.data.records || []);
      } else {
        const res = await api.get("/attendance");
        setRecords(res.data.records || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleCheckIn = async () => {
    setMessage("");
    try {
      const res = await api.post("/attendance/check-in");
      setMessage(res.data.message);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Check-in failed");
    }
  };

  const handleCheckOut = async () => {
    setMessage("");
    try {
      const res = await api.post("/attendance/check-out");
      setMessage(res.data.message);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Check-out failed");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Attendance</h1>
      </div>

      {message && (
        <div className={`alert ${message.toLowerCase().includes("success") || message.toLowerCase().includes("checked") ? "alert-success" : "alert-error"}`}>
          {message}
        </div>
      )}

      {user.role === "employee" && (
        <div className="card mb-2">
          <h3 style={{ marginBottom: "1rem" }}>Today</h3>
          <div className="flex gap-2 items-center">
            <div>
              Status:{" "}
              <strong style={{ textTransform: "capitalize" }}>
                {today?.status || "Not checked in"}
              </strong>
            </div>
            {today?.checkIn && (
              <div className="text-muted">
                In: {new Date(today.checkIn).toLocaleTimeString()}
              </div>
            )}
            {today?.checkOut && (
              <div className="text-muted">
                Out: {new Date(today.checkOut).toLocaleTimeString()}
              </div>
            )}
          </div>
          <div className="flex gap-1 mt-2">
            <button
              className="btn btn-success"
              onClick={handleCheckIn}
              disabled={!!today?.checkIn}
            >
              Check In
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCheckOut}
              disabled={!today?.checkIn || !!today?.checkOut}
            >
              Check Out
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: "1rem" }}>
          {user.role === "employee" ? "My History" : "Today's Attendance"}
        </h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {user.role !== "employee" && <th>Employee</th>}
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">No records yet</td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r._id}>
                    {user.role !== "employee" && (
                      <td>{r.employee?.name || "-"}</td>
                    )}
                    <td>{new Date(r.date).toLocaleDateString()}</td>
                    <td>
                      {r.checkIn
                        ? new Date(r.checkIn).toLocaleTimeString()
                        : "-"}
                    </td>
                    <td>
                      {r.checkOut
                        ? new Date(r.checkOut).toLocaleTimeString()
                        : "-"}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          r.status === "present"
                            ? "badge-success"
                            : r.status === "late"
                            ? "badge-warning"
                            : r.status === "on-leave"
                            ? "badge-info"
                            : "badge-danger"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td>{r.workHours || "-"}</td>
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

export default Attendance;
