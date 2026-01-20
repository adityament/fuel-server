import { Request, Response } from "express"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import User from "../models/userModel"
import { resetPasswordTemplate } from "../middleware/templates"
import { sendMail } from "../middleware/mailer"


const JWT_SECRET = process.env.JWT_SECRET_KEY!

// ✅ Forgot Password
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: "Email not registered" })
    }

    const token = jwt.sign(
      { id: user._id },
      JWT_SECRET,
      { expiresIn: "10m" }
    )

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

    await sendMail({
      to: user.email,
      subject: "Reset Password",
      html: resetPasswordTemplate(resetLink),
    })

    res.json({ message: "Password reset link sent to email" })
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR 👉", error)
    res.status(500).json({ message: "Something went wrong" })
  }
}

// ✅ Reset Password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token and new password required",
      })
    }

    const decoded: any = jwt.verify(token, JWT_SECRET)

    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()

    res.json({ message: "Password reset successfully" })
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token" })
  }
}

// ✅ Update Password (Logged-in user)
export const updatePassword = async (req: any, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "Old and new password required",
      })
    }

    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: "Old password incorrect" })
    }

    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()

    res.json({ message: "Password updated successfully" })
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" })
  }
}
