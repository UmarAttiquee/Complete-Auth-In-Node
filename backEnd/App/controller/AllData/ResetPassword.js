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
