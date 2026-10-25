import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Company = () => {
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [deptName, setDeptName] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const [c, d, l] = await Promise.all([
        api.get("/company"),
        api.get("/company/departments"),
        api.get("/company/leave-types"),
      ]);
      setCompany(c.data.company);
      setDepartments(d.data.departments || []);
      setLeaveTypes(l.data.leaveTypes || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    try {
      await api.put("/company", {
        name: company.name,
        address: company.address,
        workStartTime: company.workStartTime,
        workEndTime: company.workEndTime,
        lateThresholdMinutes: company.lateThresholdMinutes,
        currency: company.currency,
      });
      setMessage("Company settings updated");
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed");
    }
  };

  const handleAddDept = async (e) => {
    e.preventDefault();
    if (!deptName.trim()) return;
    try {
      await api.post("/company/departments", { name: deptName });
      setDeptName("");
      setMessage("Department added");
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed");
    }
  };

  if (!company) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Company Settings</h1>
      </div>

      {message && (
        <div className={`alert ${message.includes("Failed") ? "alert-error" : "alert-success"}`}>
          {message}
        </div>
      )}

      {user.role === "admin" && (
        <div className="card mb-2">
          <h3 style={{ marginBottom: "1rem" }}>General Settings</h3>
          <form onSubmit={handleUpdateCompany}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label>Company Name</label>
                <input
                  className="form-control"
                  value={company.name || ""}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  className="form-control"
                  value={company.address || ""}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Work Start (HH:mm)</label>
                <input
                  className="form-control"
                  value={company.workStartTime || "09:00"}
                  onChange={(e) => setCompany({ ...company, workStartTime: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Work End (HH:mm)</label>
                <input
                  className="form-control"
                  value={company.workEndTime || "18:00"}
                  onChange={(e) => setCompany({ ...company, workEndTime: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Late Threshold (minutes)</label>
                <input
                  type="number"
                  className="form-control"
                  value={company.lateThresholdMinutes || 15}
                  onChange={(e) =>
                    setCompany({ ...company, lateThresholdMinutes: Number(e.target.value) })
                  }
                />
              </div>
              <div className="form-group">
                <label>Currency</label>
                <input
                  className="form-control"
                  value={company.currency || "PKR"}
                  onChange={(e) => setCompany({ ...company, currency: e.target.value })}
                />
              </div>
            </div>
            <button className="btn btn-primary mt-1" type="submit">
              Save Settings
            </button>
          </form>
        </div>
      )}

      <div className="card mb-2">
        <h3 style={{ marginBottom: "1rem" }}>Departments</h3>
        {(user.role === "admin" || user.role === "hr") && (
          <form onSubmit={handleAddDept} className="flex gap-1 mb-2">
            <input
              className="form-control"
              placeholder="New department name"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">
              Add
            </button>
          </form>
        )}
        <ul style={{ listStyle: "none" }}>
          {departments.length === 0 ? (
            <li className="text-muted">No departments yet</li>
          ) : (
            departments.map((d) => (
              <li key={d._id} style={{ padding: "0.5rem 0", borderBottom: "1px solid #eee" }}>
                {d.name}
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: "1rem" }}>Leave Types</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Days Allowed</th>
                <th>Paid</th>
              </tr>
            </thead>
            <tbody>
              {leaveTypes.map((t) => (
                <tr key={t._id}>
                  <td>{t.name}</td>
                  <td>{t.daysAllowed}</td>
                  <td>{t.isPaid ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Company;
