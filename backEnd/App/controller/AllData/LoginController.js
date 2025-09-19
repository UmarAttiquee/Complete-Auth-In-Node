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
      await SessionSchemaModel.deleteOne({ userID: user._id });
    }

    //create Session
    await SessionSchemaModel.create({ userID: user._id });

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
