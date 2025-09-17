const mongoose = require("mongoose");

// Define the schema for User collection
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true, // Username is mandatory
  },
  email: {
    type: String,
    required: true, // Email is mandatory
    unique: true, // Enforce unique email addresses in DB
  },
  password: {
    type: String,
    required: true, // Password is mandatory (hashed)
  },
  isVerified: {
    type: Boolean,
    default: false, // User email verification status, defaults to false
  },
  isLoggedIn: {
    type: Boolean,
    default: false, // Tracks if user is currently logged in
  },
  token: {
    type: String,
    default: null, // Stores current JWT token for the session (if any)
  },
  otp: {
    type: String,
    default: null, // One Time Password for additional security/verification
  },
  otpExpire: {
    type: Date,
    default: null, // Expiry timestamp for the OTP
  },
});

// Create model from the schema and assign collection name explicitly
const UserModel = mongoose.model("Auth_User_Collection", userSchema);

module.exports = UserModel;
