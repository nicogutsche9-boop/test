import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET;
if (!secret) throw new Error("JWT_SECRET is required");

export function signUser(user) {
  return jwt.sign({ sub: user.id, email: user.email, admin: user.isAdmin }, secret, { expiresIn: "7d" });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Nicht eingeloggt." });
  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({ error: "Ungültige oder abgelaufene Session." });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user?.admin) return res.status(403).json({ error: "Admin-Bereich." });
  next();
}
