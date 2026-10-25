import User from "../models/User.js";
import Company from "../models/Company.js";
import LeaveType from "../models/LeaveType.js";
import generateToken from "../utils/generateToken.js";

// Check if system is already set up (any admin exists)
export const checkSetup = async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: "admin" });
    const company = await Company.findOne();
    res.json({
      success: true,
      isSetup: adminCount > 0,
      companyName: company?.name || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// First-run: Register Admin + Company
export const registerAdmin = async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount > 0) {
      return res.status(400).json({
        success: false,
        message: "System already set up. Admin already exists.",
      });
    }

    const { name, email, password, companyName, companyAddress } = req.body;

    if (!name || !email || !password || !companyName) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and company name are required",
      });
    }

    // Create company
    const company = await Company.create({
      name: companyName,
      address: companyAddress || "",
      isSetupComplete: true,
    });

    // Create default leave types
    const defaultLeaves = [
      { name: "Annual", daysAllowed: 12, isPaid: true },
      { name: "Sick", daysAllowed: 6, isPaid: true },
      { name: "Casual", daysAllowed: 6, isPaid: true },
    ];
    await LeaveType.insertMany(defaultLeaves);

    // Create admin user
    const admin = await User.create({
      name,
      email,
      password,
      role: "admin",
      employeeId: "ADMIN001",
      leaveBalances: { annual: 12, sick: 6, casual: 6 },
    });

    const token = generateToken(admin._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: "Admin and company created successfully",
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      company: {
        id: company._id,
        name: company.name,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: "Account is deactivated" });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        mustChangePassword: user.mustChangePassword,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Logout
export const logout = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.json({ success: true, message: "Logged out successfully" });
};

// Get current user
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("department", "name");
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Change password (for temp passwords)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
