const jwt = require("jsonwebtoken");
const UserModel = require("../model/UserModel");

const isAuthenticated = async (req, res, next) => {
  try {
    // 1. Extract the Authorization header from the request
    const authHeader = req.headers.authorization;

    // 2. Check if Authorization header exists and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: 0,
        message: "Authorization token is required",
      });
    }

    // 3. Extract the token part from 'Bearer <token>'
    const token = authHeader.split(" ")[1];

    // 4. Verify the JWT token using the secret key from environment variables
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // 5. Find the user in the database by the ID stored in the token payload
    const user = await UserModel.findById(decoded.id);

    // 6. If user not found, respond with 404 error
    if (!user) {
      return res.status(404).json({
        status: 0,
        message: "User not found",
      });
    }

    // 7. Check if user is marked as logged in (to prevent access after logout)
    if (!user.isLoggedIn) {
      return res.status(401).json({
        status: 0,
        message: "User is not logged in",
      });
    }

    // 8. Attach the user object to the request for further usage in route handlers
    req.user = user;

    // 9. Call next() to pass control to the next middleware or route handler
    next();
  } catch (err) {
    // Handle token verification errors and any other unexpected errors
    return res.status(401).json({
      status: 0,
      message: "Unauthorized - Invalid or expired token",
      error: err.message,
    });
  }
};

module.exports = isAuthenticated;
