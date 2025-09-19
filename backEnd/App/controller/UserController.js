// ============================
// Required Dependencies
// ============================
const jwt = require("jsonwebtoken"); // For generating and verifying JWT tokens
const bcrypt = require("bcryptjs"); // For hashing and comparing passwords
const UserModel = require("../model/UserModel"); // Mongoose User model
const {
  verifyEmail,
  sendResetPasswordEmail,
} = require("../EmailVerify/EmailVerify"); // Email sending functions
const SessionSchemaModeal = require("../model/sessionModel");
// const { sendOtpMail } = require("../EmailVerify/Otp");
const sendOtpMail = require("../EmailVerify/Otp"); // ✅ correct for default export
const SessionSchemaModel = require("../model/sessionModel");

//
// ============================
// REGISTER USER CONTROLLER
// ============================
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // 1. Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        status: 0,
        message: "Please fill all the fields",
      });
    }

    // 2. Normalize email
    const emailLower = email.toLowerCase();

    // 3. Check if email is already registered
    const existingUser = await UserModel.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({
        status: 0,
        message: "Email is already taken",
      });
    }

    // 4. Hash the password
    const hashedPassword = await bcrypt.hash(password, 15);

    // 5. Create user in DB (default: not verified)
    const user = await UserModel.create({
      username,
      email: emailLower,
      password: hashedPassword,
      isVerified: false,
    });

    // 6. Generate verification token (1 hour expiry)
    const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });

    // 7. Send verification email
    verifyEmail(token, emailLower);

    // 8. Respond with success
    return res.status(201).json({
      status: 1,
      message: "User registered successfully. Please verify your email.",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: 0,
      message: "Something went wrong",
      error: err.message,
    });
  }
};

// ============================
// VERIFY EMAIL CONTROLLER
// ============================
const verification = async (req, res) => {
  try {
    // 1. Get token from header or query param
    const token = req.headers.authorization?.split(" ")[1] || req.query.token;

    if (!token) {
      return res.status(400).json({ status: 0, message: "Token is missing" });
    }

    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY);
    } catch (err) {
      return res.status(400).json({
        status: 0,
        message:
          err.name === "TokenExpiredError"
            ? "Token expired. Please request a new one."
            : "Invalid token",
      });
    }

    // 3. Find user by decoded token id
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ status: 0, message: "User not found" });
    }

    // 4. Check if already verified
    if (user.isVerified) {
      return res.status(200).json({
        status: 1,
        message: "User already verified",
      });
    }

    // 5. Mark as verified
    user.isVerified = true;
    await user.save();

    return res.status(200).json({
      status: 1,
      message: "User verified successfully",
    });
  } catch (err) {
    return res.status(500).json({
      status: 0,
      message: "Something went wrong",
      error: err.message,
    });
  }
};

// ============================
// LOGIN CONTROLLER
// ============================
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({
        status: 0,
        message: "Please provide both email and password",
      });
    }

    // 2. Normalize email and find user
    const emailLower = email.toLowerCase();
    const user = await UserModel.findOne({ email: emailLower });

    if (!user) {
      return res
        .status(401)
        .json({ status: 0, message: "Invalid credentials" });
    }

    // 3. Check if email is verified
    if (!user.isVerified) {
      return res.status(401).json({
        status: 0,
        message: "Email not verified. Please verify your email first.",
      });
    }

    // 4. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ status: 0, message: "Invalid credentials" });
    }

    //Check sessions
    const existingSession = await SessionSchemaModeal.findOne({
      userID: user._id,
    });
    if (existingSession) {
      await SessionSchemaModeal.deleteOne({ userID: user._id });
    }

    //create Session
    await SessionSchemaModeal.create({ userID: user._id });

    // 5. Generate session token (7 days expiry)
    const accessToken = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
      expiresIn: "7d",
    });

    const refreshToken = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
      expiresIn: "7d",
    });

    // 6. Save token and login status
    user.token = accessToken;
    user.isLoggedIn = true;
    await user.save();

    return res.status(200).json({
      status: 1,
      message: "Login successful",
      data: {
        id: user._id,
        isLoggedIn: true,
        username: user.username,
        email: user.email,
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: 0,
      message: "Something went wrong",
      error: err.message,
    });
  }
};

// ============================
// LOGOUT CONTROLLER
// ============================
const logout = async (req, res) => {
  try {
    const user = req.user; // From authentication middleware

    // Invalidate session
    user.token = null;
    user.isLoggedIn = false;
    const userId = req.userId;
    await SessionSchemaModeal.deleteMany(userId);
    await UserModel.findByIdAndUpdate(userId, { isLoggedIn: false });

    await user.save();

    return res.status(200).json({
      status: 1,
      message: "Logout successful",
    });
  } catch (err) {
    return res.status(500).json({
      status: 0,
      message: "Something went wrong during logout",
      error: err.message,
    });
  }
};

// ============================
// FORGOT PASSWORD CONTROLLER
// ============================

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ status: 0, message: "Email is required" });
  }

  try {
    const user = await UserModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ status: 0, message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpire = otpExpiry;
    await user.save();

    await sendOtpMail(email, otp);

    return res.status(200).json({
      status: 1,
      message: "OTP sent to your email.",
    });
  } catch (err) {
    return res.status(500).json({
      status: 0,
      message: "Something went wrong",
      error: err.message,
    });
  }
};

module.exports = forgotPassword;

// ============================
// RESET PASSWORD CONTROLLER
// ============================
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ status: 0, message: "All fields required" });
  }

  try {
    const user = await UserModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ status: 0, message: "User not found" });
    }

    // Optional: ensure types match
    const userOtp =
      typeof user.otp === "number" ? user.otp : parseInt(user.otp);

    if (
      userOtp !== parseInt(otp) ||
      !user.otpExpire ||
      user.otpExpire < new Date()
    ) {
      return res
        .status(400)
        .json({ status: 0, message: "Invalid or expired OTP" });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 15);

    // Clear OTP fields
    user.otp = null;
    user.otpExpire = null;

    // Optional: Invalidate sessions
    await SessionSchemaModel.deleteMany({ userID: user._id });
    user.token = null;
    user.isLoggedIn = false;

    await user.save();

    return res.status(200).json({
      status: 1,
      message: "Password reset successfully",
    });
  } catch (err) {
    return res.status(500).json({
      status: 0,
      message: "Error resetting password",
      error: err.message,
    });
  }
};

// ============================
// EXPORT CONTROLLERS
// ============================
module.exports = {
  registerUser,
  verification,
  login,
  logout,
  resetPassword,
  forgotPassword,
};
