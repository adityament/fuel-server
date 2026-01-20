import { Schema, model, Document } from "mongoose"

export interface IContact extends Document {
  firstName: string
  lastName: string
  email: string
  phone: string
  address?: string
  message: string
  createdAt: Date
}

const contactSchema = new Schema<IContact>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String },
    message: { type: String, required: true },
  },
  { timestamps: true }
)

export const Contact = model<IContact>("Contact", contactSchema)
