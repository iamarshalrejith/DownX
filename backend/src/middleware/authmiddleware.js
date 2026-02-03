import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Student from "../models/Student.js";

export const protect = async (req, res, next) => {
  let token;
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1]; // extract token

      // verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // returns -> decoded => { id: "userIdFromToken", enrollmentId?: "...", iat: timestamp, exp: timestamp }

      // Try to find user in User collection first (teachers/parents)
      let user = await User.findById(decoded.id).select("-password");

      // If not found in User collection, try Student collection
      if (!user) {
        const student = await Student.findById(decoded.id);

        if (student) {
          // Transform student to match expected user structure
          user = {
            _id: student._id,
            name: student.name,
            role: "student", // Explicitly set role as student
            enrollmentId: student.enrollmentId,
            // Add any other fields you need
          };
        }
      }

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user; // attach user/student to req object
      next();
    } else {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
};

// Concept:
/*

When you try to create, delete, or update a resource, the request includes the token.

The protect middleware on the server runs first:
1. Extracts the token from the header.
2. Verifies the token using the JWT secret.
3. Decodes it to get the user/student ID.
4. First checks User collection (for teachers/parents) - excludes password
5. If not found, checks Student collection
6. Transforms the found student document to match expected user structure with role: "student"
7. Attaches it to req.user with proper role field

If token is valid → your controller runs and processes the operation.
If token is missing or invalid → the server responds with 401 Unauthorized.

*/
