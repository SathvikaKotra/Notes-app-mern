import express, { json } from "express";
import cors from "cors";
import { connect } from "mongoose";
import dotenv from "dotenv";
import { sign } from "jsonwebtoken";

import { connectionString } from "./config.json";
import User, { findOne } from "./models/user.model";
import Note, { findOne as _findOne, find } from "./models/note.model";
import { authenticateToken } from "./utilities.js";

dotenv.config();

const app = express();
app.use(json());
app.use(cors({ origin: "*" }));

connect(connectionString);

// Root route
app.get("/", (req, res) => {
  res.json({ data: "hello" });
});

// ✅ Create Account
app.post("/create-account", async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res
      .status(400)
      .json({ error: true, message: "All fields required" });
  }

  const isUser = await findOne({ email });

  if (isUser) {
    return res.json({ error: true, message: "User already exists" });
  }

  const user = new User({ fullName, email, password });
  await user.save();

  const accessToken = sign({ user }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "36000m",
  });

  return res.json({
    error: false,
    user,
    accessToken,
    message: "Registration successful",
  });
});

// ✅ Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const userInfo = await findOne({ email });

  if (!userInfo || userInfo.password !== password) {
    return res
      .status(400)
      .json({ error: true, message: "Invalid credentials" });
  }

  const accessToken = sign(
    { user: userInfo },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "36000m",
    }
  );

  return res.json({
    error: false,
    message: "Login Successful",
    email,
    accessToken,
  });
});

// ✅ Get User
app.get("/get-user", authenticateToken, async (req, res) => {
  const { user } = req.user;

  const isUser = await findOne({ _id: user._id });

  if (!isUser) return res.sendStatus(401);

  return res.json({
    user: {
      fullName: isUser.fullName,
      email: isUser.email,
      _id: isUser._id,
      createdOn: isUser.createdOn,
    },
    message: "",
  });
});

// ✅ Add Note
app.post("/add-note", authenticateToken, async (req, res) => {
  const { title, content, tags } = req.body;
  const { user } = req.user;

  if (!title || !content) {
    return res
      .status(400)
      .json({ error: true, message: "Title & Content required" });
  }

  const note = new Note({
    title,
    content,
    tags: tags || [],
    userId: user._id,
  });

  await note.save();

  return res.json({ error: false, note, message: "Note added successfully" });
});

// ✅ Edit Note
app.put("/edit-note/:noteId", authenticateToken, async (req, res) => {
  const noteId = req.params.noteId;
  const { title, content, tags, isPinned } = req.body;
  const { user } = req.user;

  try {
    const note = await _findOne({ _id: noteId, userId: user._id });
    if (!note)
      return res.status(400).json({ error: true, message: "Note not found" });

    if (title) note.title = title;
    if (content) note.content = content;
    if (tags) note.tags = tags;
    if (typeof isPinned === "boolean") note.isPinned = isPinned;

    await note.save();

    return res.json({
      error: false,
      note,
      message: "Note updated successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: "Internal Server Error" });
  }
});

// ✅ Get All Notes
app.get("/get-notes", authenticateToken, async (req, res) => {
  const { user } = req.user;

  try {
    const notes = await find({ userId: user._id }).sort({ isPinned: -1 });
    return res.json({ error: false, notes });
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: "Internal Server Error" });
  }
});

// ✅ Delete Note
app.delete("/delete-note/:noteId", authenticateToken, async (req, res) => {
  const noteId = req.params.noteId;
  const { user } = req.user;

  try {
    const note = await _findOne({ _id: noteId, userId: user._id });
    if (!note)
      return res.status(404).json({ error: true, message: "Note not found" });

    await note.deleteOne();

    return res.json({ error: false, message: "Note deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: "Internal Server Error" });
  }
});

// ✅ Update isPinned
app.put("/update-note-pinned/:noteId", authenticateToken, async (req, res) => {
  const noteId = req.params.noteId;
  const { isPinned } = req.body;
  const { user } = req.user;

  try {
    const note = await _findOne({ _id: noteId, userId: user._id });
    if (!note)
      return res.status(404).json({ error: true, message: "Note not found" });

    note.isPinned = isPinned;
    await note.save();

    return res.json({
      error: false,
      note,
      message: "Note pin updated successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: "Internal Server Error" });
  }
});

// ✅ Start Server
app.listen(process.env.PORT || 8000, () => {
  console.log(`Server running on port ${process.env.PORT || 8000}`);
});

export default app;
