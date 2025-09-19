const nodemailer = require("nodemailer"); // Library to send emails
require("dotenv").config(); // Load environment variables from .env file
const fs = require("fs"); // File system module to read files
const path = require("path"); // Utility to handle file paths
const handlebars = require("handlebars"); // Template engine to compile HTML with variables

const verifyEmail = (token, email) => {
  const templatePath = path.join(__dirname, "template.hbs");
  const templateSource = fs.readFileSync(templatePath, "utf-8");
  const template = handlebars.compile(templateSource);

  const htmlToSend = template({
    token: encodeURIComponent(token), // Encode token for safe URL use
    verificationUrl: `http://localhost:3000/api/verify?token=${encodeURIComponent(
      token
    )}`, // Verification link users will click
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER, // Your Gmail address
      pass: process.env.MAIL_PASSWORD, // Your Gmail password or app-specific password
    },
  });

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: "Email Verification",
    text: "Please verify your email.",
    html: htmlToSend,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Verification email sent:", info.response);
    }
  });
};

module.exports = { verifyEmail };
