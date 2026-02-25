import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { user_id: user.user_id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/signup", async (req, res) => {
  const { full_name, email, password, role } = req.body;
  if (!email || !password || !role) return res.status(400).json({ error: "Missing fields" });

  const [existing] = await req.db.execute("SELECT user_id FROM users WHERE email=?", [email]);
  if (existing.length) return res.status(409).json({ error: "Email already used" });

  const hash = await bcrypt.hash(password, 10);
  const [result] = await req.db.execute(
    "INSERT INTO users (full_name,email,password_hash,role) VALUES (?,?,?,?)",
    [full_name || "", email, hash, role]
  );

  const user = { user_id: result.insertId, email, role };
  const token = signToken(user);

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // set true in production https
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ user });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await req.db.execute(
    "SELECT user_id,email,role,password_hash FROM users WHERE email=?",
    [email]
  );
  if (!rows.length) return res.status(401).json({ error: "Invalid credentials" });

  const userRow = rows[0];
  const ok = await bcrypt.compare(password, userRow.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const user = { user_id: userRow.user_id, email: userRow.email, role: userRow.role };
  const token = signToken(user);

  res.cookie("token", token, { httpOnly: true, sameSite: "lax", secure: false });
  res.json({ user });
});

router.get("/me", (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.json({ user: null });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ user: payload });
  } catch {
    return res.json({ user: null });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

export default router;