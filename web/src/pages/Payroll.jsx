import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Payroll = () => {
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const res = await api.get(`/payroll?month=${month}&year=${year}`);
      setPayrolls(res.data.payrolls || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, [month, year]);

  const handleGenerateAll = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await api.post("/payroll/generate-all", { month, year });
      setMessage(res.data.message);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeAll = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await api.post("/payroll/finalize-all", { month, year });
      setMessage(res.data.message);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Payroll</h1>
        <div className="flex gap-1 items-center">
          <select
            className="form-control"
            style={{ width: "auto" }}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
          <input
            type="number"
            className="form-control"
            style={{ width: "100px" }}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes("Failed") ? "alert-error" : "alert-success"}`}>
          {message}
        </div>
      )}

      {(user.role === "admin" || user.role === "hr") && (
        <div className="flex gap-1 mb-2">
          <button className="btn btn-primary" onClick={handleGenerateAll} disabled={loading}>
            Generate All (Draft)
          </button>
          {user.role === "admin" && (
            <button className="btn btn-success" onClick={handleFinalizeAll} disabled={loading}>
              Finalize All
            </button>
          )}
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Gross</th>
                <th>Deductions</th>
                <th>Net</th>
                <th>Present</th>
                <th>Late</th>
                <th>Absent</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state">
                    No payroll data. Generate for this month.
                  </td>
                </tr>
              ) : (
                payrolls.map((p) => (
                  <tr key={p._id}>
                    <td>{p.employee?.name || "-"}</td>
                    <td>{p.grossSalary}</td>
                    <td>{p.totalDeductions}</td>
                    <td>
                      <strong>{p.netSalary}</strong>
                    </td>
                    <td>{p.presentDays}</td>
                    <td>{p.lateDays}</td>
                    <td>{p.absentDays}</td>
                    <td>
                      <span
                        className={`badge ${
                          p.status === "finalized"
                            ? "badge-success"
                            : "badge-pending"
                        }`}
                      >
                        {p.status}
                      </span>
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

export default Payroll;
