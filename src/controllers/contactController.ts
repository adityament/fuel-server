import { Request, Response } from "express"
import { Contact } from "../models/contactModel"
import { contactTemplate } from "../middleware/templates"
import { sendMail } from "../middleware/mailer"


// ✅ Submit Contact Form
export const submitContactForm = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      message,
    } = req.body

    if (!firstName || !lastName || !email || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      })
    }

    const contact = await Contact.create({
      firstName,
      lastName,
      email,
      phone,
      address,
      message,
    })

    await sendMail({
      to: process.env.CONTACT_RECEIVER_EMAIL!,
      subject: "📩 New Contact Form Submission",
      html: contactTemplate(contact),
    })

    res.status(201).json({
      success: true,
      message: "Contact form submitted successfully",
    })
  } catch (error) {
    console.error("CONTACT ERROR 👉", error)
    res.status(500).json({
      success: false,
      message: "Failed to submit contact form",
    })
  }
}

// ✅ Get All Contact Messages (Admin)
export const getAllContactMessages = async (
  req: Request,
  res: Response
) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 })

    res.json({
      success: true,
      count: messages.length,
      data: messages,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact messages",
    })
  }
}
