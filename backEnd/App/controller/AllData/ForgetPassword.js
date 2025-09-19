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
