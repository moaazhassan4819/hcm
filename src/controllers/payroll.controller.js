import Payroll from "../models/Payroll.js";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";

// Generate / calculate payroll for one employee for a month
export const generatePayroll = async (req, res) => {
  try {
    const { employeeId, month, year } = req.body;

    if (!employeeId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "employeeId, month and year required",
      });
    }

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Check if already finalized
    const existing = await Payroll.findOne({ employee: employeeId, month, year });
    if (existing && existing.status === "finalized") {
      return res.status(400).json({
        success: false,
        message: "Payroll already finalized for this month",
      });
    }

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    // Count working days (Mon-Fri in the month)
    let workingDays = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const d = cur.getDay();
      if (d !== 0 && d !== 6) workingDays++;
      cur.setDate(cur.getDate() + 1);
    }

    // Attendance summary
    const attendance = await Attendance.find({
      employee: employeeId,
      date: { $gte: start, $lte: end },
    });

    let presentDays = 0;
    let lateDays = 0;
    let absentDays = 0;
    let leaveDays = 0;

    attendance.forEach((a) => {
      if (a.status === "present") presentDays++;
      else if (a.status === "late") {
        presentDays++;
        lateDays++;
      } else if (a.status === "on-leave") leaveDays++;
      else if (a.status === "absent") absentDays++;
    });

    // Simple calculation
    const basic = employee.basicSalary || 0;
    const hra = employee.hra || 0;
    const allowances = employee.allowances || 0;
    const gross = basic + hra + allowances;

    // Per day salary
    const perDay = workingDays > 0 ? gross / workingDays : 0;

    // Unpaid leave / absent deduction (assume leave is paid for simplicity, absent not)
    const leaveDeduction = 0; // paid leaves
    const lateDeduction = lateDays * 100; // simple fixed late fine
    const absentDeduction = absentDays * perDay;
    const totalDeductions = leaveDeduction + lateDeduction + absentDeduction;
    const net = Math.max(0, gross - totalDeductions);

    const payrollData = {
      employee: employeeId,
      month,
      year,
      basicSalary: basic,
      hra,
      allowances,
      grossSalary: Math.round(gross),
      leaveDeduction: Math.round(leaveDeduction),
      lateDeduction: Math.round(lateDeduction),
      otherDeductions: Math.round(absentDeduction),
      totalDeductions: Math.round(totalDeductions),
      netSalary: Math.round(net),
      presentDays,
      lateDays,
      absentDays,
      leaveDays,
      workingDays,
      status: "draft",
    };

    let payroll;
    if (existing) {
      Object.assign(existing, payrollData);
      payroll = await existing.save();
    } else {
      payroll = await Payroll.create(payrollData);
    }

    const populated = await Payroll.findById(payroll._id).populate(
      "employee",
      "name email employeeId"
    );

    res.json({ success: true, message: "Payroll calculated", payroll: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate for all employees
export const generateAllPayroll = async (req, res) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: "month and year required" });
    }

    const employees = await User.find({ role: "employee", isActive: true });
    const results = [];

    for (const emp of employees) {
      // Reuse logic by calling internal style
      req.body.employeeId = emp._id;
      // We will just create simplified versions here
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);

      let workingDays = 0;
      const cur = new Date(start);
      while (cur <= end) {
        const d = cur.getDay();
        if (d !== 0 && d !== 6) workingDays++;
        cur.setDate(cur.getDate() + 1);
      }

      const attendance = await Attendance.find({
        employee: emp._id,
        date: { $gte: start, $lte: end },
      });

      let presentDays = 0,
        lateDays = 0,
        absentDays = 0,
        leaveDays = 0;
      attendance.forEach((a) => {
        if (a.status === "present") presentDays++;
        else if (a.status === "late") {
          presentDays++;
          lateDays++;
        } else if (a.status === "on-leave") leaveDays++;
        else if (a.status === "absent") absentDays++;
      });

      const basic = emp.basicSalary || 0;
      const hra = emp.hra || 0;
      const allowances = emp.allowances || 0;
      const gross = basic + hra + allowances;
      const perDay = workingDays > 0 ? gross / workingDays : 0;
      const lateDeduction = lateDays * 100;
      const absentDeduction = absentDays * perDay;
      const totalDeductions = lateDeduction + absentDeduction;
      const net = Math.max(0, gross - totalDeductions);

      const data = {
        employee: emp._id,
        month,
        year,
        basicSalary: basic,
        hra,
        allowances,
        grossSalary: Math.round(gross),
        leaveDeduction: 0,
        lateDeduction: Math.round(lateDeduction),
        otherDeductions: Math.round(absentDeduction),
        totalDeductions: Math.round(totalDeductions),
        netSalary: Math.round(net),
        presentDays,
        lateDays,
        absentDays,
        leaveDays,
        workingDays,
        status: "draft",
      };

      const existing = await Payroll.findOne({ employee: emp._id, month, year });
      if (existing && existing.status !== "finalized") {
        Object.assign(existing, data);
        await existing.save();
        results.push(existing);
      } else if (!existing) {
        const p = await Payroll.create(data);
        results.push(p);
      }
    }

    res.json({
      success: true,
      message: `Payroll generated for ${results.length} employees`,
      count: results.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payrolls
export const getPayrolls = async (req, res) => {
  try {
    const { month, year, employee, status } = req.query;
    const filter = {};
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);
    if (employee) filter.employee = employee;
    if (status) filter.status = status;

    // Employees can only see their own
    if (req.user.role === "employee") {
      filter.employee = req.user._id;
    }

    const payrolls = await Payroll.find(filter)
      .populate("employee", "name email employeeId")
      .populate("finalizedBy", "name")
      .sort({ year: -1, month: -1 });

    res.json({ success: true, count: payrolls.length, payrolls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Finalize payroll (Admin)
export const finalizePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ success: false, message: "Payroll not found" });
    }
    if (payroll.status === "finalized") {
      return res.status(400).json({ success: false, message: "Already finalized" });
    }

    payroll.status = "finalized";
    payroll.finalizedBy = req.user._id;
    payroll.finalizedAt = new Date();
    await payroll.save();

    res.json({ success: true, message: "Payroll finalized", payroll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Finalize all for a month
export const finalizeAll = async (req, res) => {
  try {
    const { month, year } = req.body;
    const result = await Payroll.updateMany(
      { month, year, status: "draft" },
      {
        status: "finalized",
        finalizedBy: req.user._id,
        finalizedAt: new Date(),
      }
    );
    res.json({
      success: true,
      message: `Finalized ${result.modifiedCount} payrolls`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
