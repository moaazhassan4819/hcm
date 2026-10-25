import Leave from "../models/Leave.js";
import LeaveType from "../models/LeaveType.js";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";

// Calculate business days (simple - excludes weekends)
const calcDays = (start, end) => {
  let count = 0;
  const cur = new Date(start);
  const endDate = new Date(end);
  while (cur <= endDate) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count || 1;
};

// Apply leave
export const applyLeave = async (req, res) => {
  try {
    const { leaveTypeId, startDate, endDate, reason } = req.body;

    if (!leaveTypeId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Leave type, start date and end date required",
      });
    }

    const leaveType = await LeaveType.findById(leaveTypeId);
    if (!leaveType) {
      return res.status(404).json({ success: false, message: "Leave type not found" });
    }

    const totalDays = calcDays(startDate, endDate);
    const user = await User.findById(req.user._id);

    // Simple balance check using leaveBalances map
    const balanceKey = leaveType.name.toLowerCase();
    const balance = user.leaveBalances?.[balanceKey] ?? leaveType.daysAllowed;

    if (totalDays > balance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient leave balance. Available: ${balance}, Requested: ${totalDays}`,
      });
    }

    const leave = await Leave.create({
      employee: req.user._id,
      leaveType: leaveTypeId,
      startDate,
      endDate,
      totalDays,
      reason: reason || "",
      status: "pending",
    });

    const populated = await Leave.findById(leave._id)
      .populate("leaveType", "name")
      .populate("employee", "name email employeeId");

    res.status(201).json({ success: true, message: "Leave applied", leave: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get my leaves
export const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user._id })
      .populate("leaveType", "name isPaid")
      .sort({ createdAt: -1 });
    res.json({ success: true, leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all leaves (HR/Admin)
export const getAllLeaves = async (req, res) => {
  try {
    const { status, employee } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (employee) filter.employee = employee;

    const leaves = await Leave.find(filter)
      .populate("employee", "name email employeeId department")
      .populate("leaveType", "name isPaid")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: leaves.length, leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve / Reject leave
export const reviewLeave = async (req, res) => {
  try {
    const { status, reviewNote } = req.body; // status: approved | rejected

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be approved or rejected" });
    }

    const leave = await Leave.findById(req.params.id).populate("leaveType");
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave not found" });
    }
    if (leave.status !== "pending") {
      return res.status(400).json({ success: false, message: "Leave already reviewed" });
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewNote = reviewNote || "";
    leave.reviewedAt = new Date();
    await leave.save();

    // If approved, deduct balance and mark attendance as on-leave
    if (status === "approved") {
      const user = await User.findById(leave.employee);
      const key = leave.leaveType.name.toLowerCase();
      if (user.leaveBalances && user.leaveBalances[key] !== undefined) {
        user.leaveBalances[key] = Math.max(0, user.leaveBalances[key] - leave.totalDays);
        await user.save();
      }

      // Mark attendance for leave days
      const cur = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      while (cur <= end) {
        const day = cur.getDay();
        if (day !== 0 && day !== 6) {
          const dateOnly = new Date(cur);
          dateOnly.setHours(0, 0, 0, 0);
          await Attendance.findOneAndUpdate(
            { employee: leave.employee, date: dateOnly },
            {
              employee: leave.employee,
              date: dateOnly,
              status: "on-leave",
            },
            { upsert: true }
          );
        }
        cur.setDate(cur.getDate() + 1);
      }
    }

    const populated = await Leave.findById(leave._id)
      .populate("employee", "name email")
      .populate("leaveType", "name")
      .populate("reviewedBy", "name");

    res.json({ success: true, message: `Leave ${status}`, leave: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel own pending leave
export const cancelLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave not found" });
    }
    if (leave.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not your leave request" });
    }
    if (leave.status !== "pending") {
      return res.status(400).json({ success: false, message: "Can only cancel pending leaves" });
    }

    leave.status = "cancelled";
    await leave.save();
    res.json({ success: true, message: "Leave cancelled" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
