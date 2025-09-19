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
