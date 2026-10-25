import { useEffect, useState } from "react";
import api from "../api/axios";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    department: "",
    designation: "",
    phone: "",
    basicSalary: "",
    hra: "",
    allowances: "",
  });

  const load = async () => {
    try {
      const [empRes, deptRes] = await Promise.all([
        api.get("/employees"),
        api.get("/company/departments"),
      ]);
      setEmployees(empRes.data.employees || []);
      setDepartments(deptRes.data.departments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await api.post("/employees", {
        ...form,
        basicSalary: Number(form.basicSalary) || 0,
        hra: Number(form.hra) || 0,
        allowances: Number(form.allowances) || 0,
        department: form.department || undefined,
      });
      setMessage(
        `Created! ${form.password ? "Password" : "Temp password"}: ${res.data.temporaryPassword} (share with employee)`
      );
      setShowForm(false);
      setForm({
        name: "",
        email: "",
        password: "",
        role: "employee",
        department: "",
        designation: "",
        phone: "",
        basicSalary: "",
        hra: "",
        allowances: "",
      });
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to create");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Employees</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Employee"}
        </button>
      </div>

      {message && (
        <div className={`alert ${message.includes("Created") ? "alert-success" : "alert-error"}`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="card mb-2">
          <h3 style={{ marginBottom: "1rem" }}>New Employee</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label>Name *</label>
                <input className="form-control" required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input className="form-control" type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Password (optional)</label>
                <input className="form-control" type="password" minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Leave blank to generate one" />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select className="form-control" value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="employee">Employee</option>
                  <option value="hr">HR</option>
                </select>
              </div>
              <div className="form-group">
                <label>Department</label>
                <select className="form-control" value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}>
                  <option value="">Select...</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Designation</label>
                <input className="form-control" value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input className="form-control" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Basic Salary</label>
                <input className="form-control" type="number" value={form.basicSalary}
                  onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} />
              </div>
              <div className="form-group">
                <label>HRA</label>
                <input className="form-control" type="number" value={form.hra}
                  onChange={(e) => setForm({ ...form, hra: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Allowances</label>
                <input className="form-control" type="number" value={form.allowances}
                  onChange={(e) => setForm({ ...form, allowances: e.target.value })} />
              </div>
            </div>
            <button className="btn btn-primary mt-1" type="submit">Create Employee</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">No employees yet. Add one!</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id}>
                    <td>{emp.employeeId}</td>
                    <td>{emp.name}</td>
                    <td>{emp.email}</td>
                    <td>
                      <span className="badge badge-info">{emp.role}</span>
                    </td>
                    <td>{emp.department?.name || "-"}</td>
                    <td>{emp.designation || "-"}</td>
                    <td>
                      <span className={`badge ${emp.isActive ? "badge-success" : "badge-danger"}`}>
                        {emp.isActive ? "Active" : "Inactive"}
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

export default Employees;
