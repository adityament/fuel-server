import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import User from "../models/userModel";


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


const token = jwt.sign(
{ role: "superadmin" },
process.env.JWT_SECRET_KEY!,
{ expiresIn: "2h" }
);


return res.json({
token,
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


const token = jwt.sign(
{ id: user._id, role: user.role },
process.env.JWT_SECRET_KEY!,
{ expiresIn: "2h" }
);


res.json({
token,
user: {
id: user._id,
email: user.email,
role: user.role,
},
});
};