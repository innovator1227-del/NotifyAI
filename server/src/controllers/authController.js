import jwt from "jsonwebtoken";
import User from "../models/User.js";

const createToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }
    if (name.trim().length < 2 || name.trim().length > 80) {
      return res
        .status(400)
        .json({ message: "Name must be between 2 and 80 characters" });
    }
    if (password.length < 4) {
      return res
        .status(400)
        .json({ message: "Password must be at least 4 characters" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing)
      return res.status(409).json({ message: "Email is already registered" });
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });
    res.status(201).json({
      token: createToken(user._id.toString()),
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email is already registered" });
    }
    console.error("Could not register user:", error);
    res.status(500).json({ message: "Could not register user" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string") {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    res.json({
      token: createToken(user._id.toString()),
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Could not log in:", error);
    res.status(500).json({ message: "Could not log in" });
  }
};

const me = async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user: publicUser(user) });
};

const updateMe = async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (name.length < 2 || name.length > 80) {
    return res
      .status(400)
      .json({ message: "Name must be between 2 and 80 characters." });
  }
  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: { name } },
    { new: true, runValidators: true },
  );
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json({ user: publicUser(user) });
};

export { register, login, me, updateMe };
