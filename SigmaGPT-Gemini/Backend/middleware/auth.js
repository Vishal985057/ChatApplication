import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "sigmagpt-secret-2024";

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Access denied. Please log in." });

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        res.status(403).json({ error: "Session expired. Please log in again." });
    }
};
