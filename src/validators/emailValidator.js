const { z } = require("zod");

const emailSchema = z.object({
  to: z.union([
    z.string().email({ message: "Invalid email address" }),
    z.array(z.string().email({ message: "Invalid email address" }))
  ]),
  subject: z.string().min(1, { message: "Subject is required" }).max(200),
  html: z.string().min(1, { message: "HTML content is required" }),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string().optional(), // Base64 content
    path: z.string().optional(),    // URL or local path
    contentType: z.string().optional()
  })).optional(),
});


const batchEmailSchema = z.object({
  emails: z.array(emailSchema).min(1, { message: "At least one email is required in the batch" }).max(50, { message: "Maximum 50 emails allowed per batch" }),
});

module.exports = {
  emailSchema,
  batchEmailSchema,
};

