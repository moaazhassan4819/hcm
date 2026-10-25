import User from "../models/User.js";
import crypto from "crypto";

// Generate simple employee ID
const generateEmployeeId = async () => {
  const count = await User.countDocuments({ role: { $in: ["employee", "hr"] } });
  return `EMP${String(count + 1).padStart(4, "0")}`;
};

// List all employees (HR & Admin)
export const getEmployees = async (req, res) => {
  try {
    const { role, department, search } = req.query;
    const filter = { role: { $in: ["employee", "hr"] } };

    if (role) filter.role = role;
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }

    const employees = await User.find(filter)
      .select("-password")
      .populate("department", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: employees.length, employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single employee
export const getEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id)
      .select("-password")
      .populate("department", "name");

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Employees can only view themselves
    if (req.user.role === "employee" && req.user._id.toString() !== employee._id.toString()) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    res.json({ success: true, employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create employee (HR / Admin) - creates login with temp password
export const createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      role = "employee",
      department,
      designation,
      phone,
      joiningDate,
      basicSalary,
      hra,
      allowances,
      password, // optional - if not given, generate temp
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    // Only admin can create HR
    if (role === "hr" && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admin can create HR accounts" });
    }

    if (role === "admin") {
      return res.status(400).json({ success: false, message: "Cannot create another admin this way" });
    }

    const tempPassword = password || crypto.randomBytes(4).toString("hex"); // 8 char temp
    const employeeId = await generateEmployeeId();

    const employee = await User.create({
      name,
      email,
      password: tempPassword,
      role,
      employeeId,
      department,
      designation,
      phone,
      joiningDate: joiningDate || new Date(),
      basicSalary: basicSalary || 0,
      hra: hra || 0,
      allowances: allowances || 0,
      mustChangePassword: true,
      leaveBalances: { annual: 12, sick: 6, casual: 6 },
    });

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        employeeId: employee.employeeId,
      },
      temporaryPassword: tempPassword, // show once
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update employee
export const updateEmployee = async (req, res) => {
  try {
    const allowed = [
      "name",
      "phone",
      "department",
      "designation",
      "joiningDate",
      "basicSalary",
      "hra",
      "allowances",
      "isActive",
      "leaveBalances",
    ];

    // Only admin can change role
    if (req.body.role && req.user.role === "admin") {
      allowed.push("role");
    }

    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const employee = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.json({ success: true, message: "Employee updated", employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Soft delete / deactivate
export const deactivateEmployee = async (req, res) => {
  try {
    const employee = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select("-password");

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.json({ success: true, message: "Employee deactivated", employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
