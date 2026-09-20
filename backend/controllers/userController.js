const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString()
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ token, message: "Login successful" });
  } catch (error) {
    res.status(500).json({ message: "Error logging in" });
  }
};

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide name, email, and password." });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(409)
        .json({ message: "User with this email already exists." });
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({ token, message: "Registration successful" });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = {};
      for (let field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return res.status(400).json({
        message: "Validation failed",
        errors: errors,
        fullMessage: Object.values(errors).join(", "),
      });
    }

    res.status(500).json({
      message: "Server error occurred during registration. Please try again.",
    });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (user) {
      res.json({
        id: user._id,
        name: user.name,
        email: user.email,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateUserProfile = async (req, res) => {
  const { name, email, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const needsPasswordVerification = (newPassword || (email && email !== user.email));
    if (needsPasswordVerification && currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect." });
      }
    } else if (needsPasswordVerification && !currentPassword) {
        return res.status(400).json({ message: "Current password is required to update email or password." });
    }

    user.name = name || user.name;
    user.email = email || user.email;

    if (newPassword) {
      user.password = newPassword;
    }

    const updatedUser = await user.save();

    const token = jwt.sign(
      {
        userId: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Profile updated successfully",
      token,
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ message: 'Validation error', errors });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  loginUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
};