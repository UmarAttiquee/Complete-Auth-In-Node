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
