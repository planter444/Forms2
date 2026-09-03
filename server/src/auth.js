import jwt from "jsonwebtoken";

const getSecret = () => process.env.JWT_SECRET || "change-me";

export const issueAdminToken = () =>
  jwt.sign({ role: "admin" }, getSecret(), { expiresIn: "8h" });

export const requireAdmin = (request, response, next) => {
  const authorization = request.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!token) {
    return response.status(401).json({ message: "Authentication required." });
  }

  try {
    const payload = jwt.verify(token, getSecret());

    if (payload.role !== "admin") {
      return response.status(403).json({ message: "Access denied." });
    }

    next();
  } catch {
    return response.status(401).json({ message: "Invalid or expired token." });
  }
};
