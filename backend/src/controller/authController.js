import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// Register a new User
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name,
      email: email,
      password: hashedPassword,
      role: role,
    });

    const savedUser = await newUser.save();

    const { password: _, ...userdata } = savedUser._doc;
    const token = generateToken(savedUser._id);
    return res.status(201).json({ ...userdata, token });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const { password: _, ...userdata } = user._doc;
    const token = generateToken(user._id);
    return res.status(200).json({ ...userdata, token });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get current user profile
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("getMe error:", error);
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
};

// Update profile — name and/or email
export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name?.trim() && !email?.trim()) {
      return res.status(400).json({ message: "Provide name or email to update" });
    }

    const updates = {};
    if (name?.trim())  updates.name  = name.trim();
    if (email?.trim()) updates.email = email.trim().toLowerCase();

    // Make sure email is not already taken by someone else
    if (updates.email) {
      const taken = await User.findOne({
        email: updates.email,
        _id: { $ne: req.user._id },
      });
      if (taken) {
        return res.status(409).json({ message: "Email already in use" });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return fresh token so Redux state stays in sync
    const token = generateToken(updatedUser._id);

    return res.status(200).json({
      message: "Profile updated successfully",
      user: { ...updatedUser._doc, token },
    });
  } catch (error) {
    console.error("updateProfile error:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both passwords are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "New password must be different from current password" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("changePassword error:", error);
    return res.status(500).json({ message: "Failed to change password" });
  }
};