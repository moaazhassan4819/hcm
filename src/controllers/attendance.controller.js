import Attendance from "../models/Attendance.js";
import Company from "../models/Company.js";
import User from "../models/User.js";

// Helper: get start of day
const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Parse HH:mm to minutes
const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

// Check-in
export const checkIn = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const today = startOfDay();

    // Check if already checked in
    let attendance = await Attendance.findOne({ employee: employeeId, date: today });
    if (attendance && attendance.checkIn) {
      return res.status(400).json({ success: false, message: "Already checked in today" });
    }

    const company = await Company.findOne();
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = timeToMinutes(company?.workStartTime || "09:00");
    const threshold = company?.lateThresholdMinutes || 15;

    let isLate = false;
    let lateMinutes = 0;
    let status = "present";

    if (currentMinutes > startMinutes + threshold) {
      isLate = true;
      lateMinutes = currentMinutes - startMinutes;
      status = "late";
    }

    if (attendance) {
      attendance.checkIn = now;
      attendance.isLate = isLate;
      attendance.lateMinutes = lateMinutes;
      attendance.status = status;
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        employee: employeeId,
        date: today,
        checkIn: now,
        isLate,
        lateMinutes,
        status,
      });
    }

    res.json({
      success: true,
      message: isLate ? `Checked in (Late by ${lateMinutes} mins)` : "Checked in successfully",
      attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Check-out
export const checkOut = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const today = startOfDay();

    const attendance = await Attendance.findOne({ employee: employeeId, date: today });
    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ success: false, message: "Please check in first" });
    }
    if (attendance.checkOut) {
      return res.status(400).json({ success: false, message: "Already checked out today" });
    }

    const now = new Date();
    attendance.checkOut = now;

    // Calculate work hours
    const diffMs = now - attendance.checkIn;
    attendance.workHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    await attendance.save();

    res.json({
      success: true,
      message: "Checked out successfully",
      attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get my attendance (employee)
export const getMyAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = { employee: req.user._id };

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(filter).sort({ date: -1 });
    res.json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all attendance (HR/Admin) - with filters
export const getAllAttendance = async (req, res) => {
  try {
    const { date, employee, month, year, status } = req.query;
    const filter = {};

    if (employee) filter.employee = employee;
    if (status) filter.status = status;

    if (date) {
      const d = startOfDay(new Date(date));
      filter.date = d;
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    } else {
      // Default today
      filter.date = startOfDay();
    }

    const records = await Attendance.find(filter)
      .populate("employee", "name email employeeId department")
      .sort({ date: -1 });

    res.json({ success: true, count: records.length, records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Today's status for current user
export const getTodayStatus = async (req, res) => {
  try {
    const today = startOfDay();
    const attendance = await Attendance.findOne({
      employee: req.user._id,
      date: today,
    });
    res.json({ success: true, attendance: attendance || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark absent for employees who didn't check in (can be called by HR or cron-like)
export const markAbsents = async (req, res) => {
  try {
    const today = startOfDay();
    const employees = await User.find({ role: "employee", isActive: true });

    let marked = 0;
    for (const emp of employees) {
      const existing = await Attendance.findOne({ employee: emp._id, date: today });
      if (!existing) {
        await Attendance.create({
          employee: emp._id,
          date: today,
          status: "absent",
        });
        marked++;
      }
    }

    res.json({ success: true, message: `Marked ${marked} employees as absent` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
