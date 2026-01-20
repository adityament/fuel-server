export const resetPasswordTemplate = (resetLink: string) => `
  <h3>Password Reset Request</h3>
  <p>You requested to reset your password.</p>
  <p>This link is valid for <b>10 minutes</b>.</p>
  <a href="${resetLink}">Reset Password</a>
`

export const contactTemplate = (data: any) => `
  <h3>New Contact Message</h3>
  <p><b>Name:</b> ${data.firstName} ${data.lastName}</p>
  <p><b>Email:</b> ${data.email}</p>
  <p><b>Phone:</b> ${data.phone}</p>
  <p><b>Address:</b> ${data.address || "-"}</p>
  <p><b>Message:</b><br/>${data.message}</p>
`
