// ============================
// Email Sending Module
// ============================

const nodemailer = require("nodemailer"); // Library to send emails
require("dotenv").config(); // Load environment variables from .env file
const fs = require("fs"); // File system module to read files
const path = require("path"); // Utility to handle file paths
const handlebars = require("handlebars"); // Template engine to compile HTML with variables

// ============================
// SEND VERIFICATION EMAIL
// ============================

/**
 * Sends an email verification link to the user's email.
 *
 * @param {string} token - JWT token for verification
 * @param {string} email - Recipient's email address
 */
const verifyEmail = (token, email) => {
  // 1. Construct path to the email template file (template.hbs)
  const templatePath = path.join(__dirname, "template.hbs");

  // 2. Read template contents as UTF-8 string
  const templateSource = fs.readFileSync(templatePath, "utf-8");

  // 3. Compile the template with Handlebars to generate a reusable function
  const template = handlebars.compile(templateSource);

  // 4. Generate HTML email body by injecting variables into the template
  const htmlToSend = template({
    token: encodeURIComponent(token), // Encode token for safe URL use
    verificationUrl: `http://localhost:3000/api/verify?token=${encodeURIComponent(
      token
    )}`, // Verification link users will click
  });

  // 5. Create a transporter object using Gmail SMTP service and auth from env
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER, // Your Gmail address
      pass: process.env.MAIL_PASSWORD, // Your Gmail password or app-specific password
    },
  });

  // 6. Define email options including from, to, subject, and both text & HTML bodies
  const mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: "Email Verification",
    text: "Please verify your email.",
    html: htmlToSend,
  };

  // 7. Send the email and handle callback for success or failure
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Verification email sent:", info.response);
    }
  });
};

// ============================
// SEND PASSWORD RESET EMAIL
// ============================

/**
 * Sends a password reset link email to the user.
 *
 * @param {string} email - Recipient's email address
 * @param {string} token - JWT token for password reset
 */
const sendResetPasswordEmail = async (email, token) => {
  // 1. Construct the password reset link (usually your frontend URL)
  const resetLink = `http://localhost:3000/api/reset-password/?token=${token}`;

  // 2. Create transporter with Gmail SMTP service and auth from env
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  // 3. Define email options including from, to, subject, and HTML body with reset link
  const mailOptions = {
    from: `"Your App Name" <${process.env.MAIL_USER}>`, // Customize sender info
    to: email,
    subject: "Reset Your Password",
    html: `
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link is valid for 15 minutes only.</p>
    `,
  };

  // 4. Send the email asynchronously
  await transporter.sendMail(mailOptions);
};

// ============================
// EXPORT FUNCTIONS
// ============================

module.exports = { verifyEmail, sendResetPasswordEmail };
