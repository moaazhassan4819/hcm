import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import Payroll from "../models/Payroll.js";
import Department from "../models/Department.js";

const startOfDay = (d = new Date()) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const getDashboardStats = async (req, res) => {
  try {
    const role = req.user.role;
    const today = startOfDay();

    // Common counts
    const totalEmployees = await User.countDocuments({
      role: "employee",
      isActive: true,
    });
    const totalHR = await User.countDocuments({ role: "hr", isActive: true });
    const totalDepartments = await Department.countDocuments();

    // Today's attendance
    const todayPresent = await Attendance.countDocuments({
      date: today,
      status: { $in: ["present", "late"] },
    });
    const todayLate = await Attendance.countDocuments({ date: today, isLate: true });
    const todayAbsent = await Attendance.countDocuments({ date: today, status: "absent" });
    const todayOnLeave = await Attendance.countDocuments({ date: today, status: "on-leave" });

    // Pending leaves
    const pendingLeaves = await Leave.countDocuments({ status: "pending" });

    // This month payroll drafts
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const draftPayrolls = await Payroll.countDocuments({
      month: currentMonth,
      year: currentYear,
      status: "draft",
    });

    // Role specific
    let myStats = {};
    if (role === "employee") {
      const myAttendance = await Attendance.findOne({
        employee: req.user._id,
        date: today,
      });
      const myPendingLeaves = await Leave.countDocuments({
        employee: req.user._id,
        status: "pending",
      });
      const myLeaves = await Leave.find({ employee: req.user._id })
        .populate("leaveType", "name")
        .sort({ createdAt: -1 })
        .limit(5);

      myStats = {
        todayStatus: myAttendance?.status || "not-checked-in",
        checkIn: myAttendance?.checkIn || null,
        checkOut: myAttendance?.checkOut || null,
        pendingLeaves: myPendingLeaves,
        recentLeaves: myLeaves,
        leaveBalances: req.user.leaveBalances,
      };
    }

    res.json({
      success: true,
      stats: {
        totalEmployees,
        totalHR,
        totalDepartments,
        today: {
          present: todayPresent,
          late: todayLate,
          absent: todayAbsent,
          onLeave: todayOnLeave,
        },
        pendingLeaves,
        draftPayrolls,
        myStats,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
