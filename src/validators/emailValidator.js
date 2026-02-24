const { z } = require("zod");

const emailSchema = z.object({
  to: z.string().email({ message: "Invalid email address" }),
  subject: z.string().min(1, { message: "Subject is required" }).max(200),
  html: z.string().min(1, { message: "HTML content is required" }),
});

module.exports = {
  emailSchema,
};
