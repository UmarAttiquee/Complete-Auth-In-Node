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
