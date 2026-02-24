const { z } = require("zod");

const emailSchema = z.object({
  to: z.union([
    z.string().email({ message: "Invalid email address" }),
    z.array(z.string().email({ message: "Invalid email address" }))
  ]),
  subject: z.string().max(200).optional(),
  html: z.string().optional(),
  attachments: z.union([
    z.string().url(), // Support for a single URL string
    z.array(z.object({
      filename: z.string().optional(),
      content: z.any().optional(),
      path: z.string().optional(),
      contentType: z.string().optional()
    }))
  ]).optional().transform((val) => {
    if (typeof val === 'string') {
      return [{ path: val }];
    }
    return val;
  }),
  rsvp_link: z.string().url().optional(),
});


const batchEmailSchema = z.object({
  emails: z.union([
    z.array(emailSchema),
    z.array(z.string().email())
  ]).transform(val => {
    // Convert array of strings to array of objects
    if (typeof val[0] === 'string') {
      return val.map(to => ({ to }));
    }
    return val;
  }),
  subject: z.string().max(200).optional(),
  html: z.string().optional(),
  rsvp_links: z.array(z.string().url()).optional(),
});

module.exports = {
  emailSchema,
  batchEmailSchema,
};

