import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import User from "../models/userModel";

// 🔐 Short-lived access token + long-lived refresh token.
//    `type` is stamped on both so a refresh token can never be replayed
//    as an access token on the protected routes (see authMiddleware).
const ACCESS_TOKEN_EXPIRY = "2h";
const REFRESH_TOKEN_EXPIRY = "7d";

const signAccessToken = (payload: object) =>
  jwt.sign({ ...payload, type: "access" }, process.env.JWT_SECRET_KEY!, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

const signRefreshToken = (payload: object) =>
  jwt.sign({ ...payload, type: "refresh" }, process.env.JWT_SECRET_KEY!, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });


export const login = async (req: Request, res: Response) => {
const { email, password } = req.body as {
email?: string;
password?: string;
};


if (!email || !password) {
return res.status(400).json({ message: "Email and password required" });
}


// SUPER ADMIN LOGIN
if (email === process.env.SUPER_ADMIN_EMAIL) {
if (password !== process.env.SUPER_ADMIN_PASSWORD) {
return res.status(400).json({ message: "Invalid credentials" });
}


const token = signAccessToken({ role: "superadmin" });
const refreshToken = signRefreshToken({ role: "superadmin" });


return res.json({
token,
refreshToken,
user: { role: "superadmin", email },
});
}


const user = await User.findOne({ email });
if (!user || !user.password) {
return res.status(400).json({ message: "Invalid credentials" });
}


const isMatch = await bcrypt.compare(password, user.password);
if (!isMatch) {
return res.status(400).json({ message: "Invalid credentials" });
}


const token = signAccessToken({ id: user._id, role: user.role });
const refreshToken = signRefreshToken({ id: user._id, role: user.role });


res.json({
token,
refreshToken,
user: {
id: user._id,
email: user.email,
role: user.role,
},
});
};


/**
 * 🔄 REFRESH — trade a valid refresh token for a new access token.
 * Public route: the access token is expected to be expired by this point.
 * The refresh token is rotated on every use.
 */
export const refreshAccessToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token required" });
  }

  try {
    const decoded: any = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY!);

    // 🚫 an access token must not be usable as a refresh token
    if (decoded.type !== "refresh") {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // ✅ SUPER ADMIN (ENV BASED, DB ME NAHI)
    if (decoded.role === "superadmin" && !decoded.id) {
      return res.json({
        token: signAccessToken({ role: "superadmin" }),
        refreshToken: signRefreshToken({ role: "superadmin" }),
      });
    }

    // ✅ ADMIN / STAFF — user must still exist
    const user = await User.findById(decoded.id).select("-password").lean();
    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    return res.json({
      token: signAccessToken({ id: user._id, role: user.role }),
      refreshToken: signRefreshToken({ id: user._id, role: user.role }),
    });
  } catch (error) {
    return res.status(401).json({ message: "Refresh token expired" });
  }
};