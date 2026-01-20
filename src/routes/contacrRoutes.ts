import { Router } from "express"
import { getAllContactMessages, submitContactForm } from "../controllers/contactController"
import { allowRoles, auth } from "../middleware/authMiddleware"

const router = Router()
router.post("/create", submitContactForm)
router.get("/contact",auth, allowRoles("admin"), getAllContactMessages)

export default router
