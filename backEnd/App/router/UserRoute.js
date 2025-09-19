const express = require("express");
const {
  registerUser,
  verification,
  login,
  forgotPassword,
  resetPassword,
  logout,
} = require("../controller/UserController");
const isAuthenticated = require("../middlewares/isAuthenticated");

const UserRouter = express.Router();

// Route to register a new user
UserRouter.post("/register", registerUser);

// Routes to handle email verification (supports both POST and GET)
UserRouter.post("/verify", verification);
UserRouter.get("/verify", verification);

// Route for user login
UserRouter.post("/login", login);

// Route for user logout - protected route (requires authentication)
UserRouter.post("/logout", isAuthenticated, logout);

// Route to initiate forgot password process (send reset email)
UserRouter.post("/forgot-password", forgotPassword);

// Route to reset password using token (token passed as URL param)
UserRouter.post("/reset-password", resetPassword);

module.exports = UserRouter;
