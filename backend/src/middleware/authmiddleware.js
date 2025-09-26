import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1]; // extract token

      // verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // returns -> decoded => { id: "userIdFromToken", iat: timestamp, exp: timestamp }

      req.user = await User.findById(decoded.id).select("-password"); // attach user to req object, excluding password
      next();
    } else {
      res.status(401).json({ message: "Not authorized, token missing" });
    }
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(401).json({ message: "Not authorized, token invalid" });
  }
};

// Concept:
/*

When you try to create, delete, or update a resource, the request includes the token.

The protect middleware on the server runs first:
Extracts the token from the header.
Verifies the token using the JWT secret.
Decodes it to get the user ID.
Fetches the user from the database (without password) and attaches it to req.user.

If token is valid → your controller runs and processes the operation.
If token is missing or invalid → the server responds with 401 Unauthorized.

 */
