import Company from "../models/Company.js";
import Department from "../models/Department.js";
import LeaveType from "../models/LeaveType.js";

// Get company settings
export const getCompany = async (req, res) => {
  try {
    const company = await Company.findOne();
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }
    res.json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update company settings (Admin only)
export const updateCompany = async (req, res) => {
  try {
    let company = await Company.findOne();
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    const allowed = [
      "name",
      "address",
      "officeLocation",
      "workStartTime",
      "workEndTime",
      "lateThresholdMinutes",
      "currency",
    ];

    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        company[key] = req.body[key];
      }
    });

    await company.save();
    res.json({ success: true, message: "Company updated", company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Departments
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().populate("head", "name email");
    res.json({ success: true, departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name, description, head } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Department name required" });
    }
    const dept = await Department.create({ name, description, head });
    res.status(201).json({ success: true, department: dept });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!dept) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }
    res.json({ success: true, department: dept });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }
    res.json({ success: true, message: "Department deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Leave Types
export const getLeaveTypes = async (req, res) => {
  try {
    const leaveTypes = await LeaveType.find();
    res.json({ success: true, leaveTypes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createLeaveType = async (req, res) => {
  try {
    const leaveType = await LeaveType.create(req.body);
    res.status(201).json({ success: true, leaveType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLeaveType = async (req, res) => {
  try {
    const leaveType = await LeaveType.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!leaveType) {
      return res.status(404).json({ success: false, message: "Leave type not found" });
    }
    res.json({ success: true, leaveType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
