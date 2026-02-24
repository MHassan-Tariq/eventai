const { emailSchema, batchEmailSchema } = require('../validators/emailValidator');
const emailService = require('../services/emailService');

/**
 * Controller to handle POST /api/v1/send-email
 */
const sendEmailController = async (req, res) => {
  try {
    // 1. Pre-process "to" field if it comes as a comma-separated string or multiple fields from multipart/form-data
    if (typeof req.body.to === 'string' && req.body.to.includes(',')) {
      req.body.to = req.body.to.split(',').map(email => email.trim());
    } else if (Array.isArray(req.body.to)) {
      req.body.to = req.body.to.map(email => email.trim());
    }

    // 2. Validate Payload
    const validation = emailSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validation.error.format(),
      });
    }

    // 3. Merge Attachments (Physical files from Multer + URL/Base64 from JSON body)
    const bodyAttachments = validation.data.attachments || [];
    const physicalAttachments = req.files || [];

    // 4. Call Service
    const result = await emailService.sendEmail({
      ...validation.data,
      attachments: [...bodyAttachments, ...physicalAttachments],
    });

    // 4. Respond
    return res.status(200).json({
      status: 'success',
      message: 'Email sent successfully',
      data: result,
    });

  } catch (error) {
    console.error('Controller Error:', error);
    const statusCode = error.code === 'EAUTH' ? 401 : 500;
    return res.status(statusCode).json({
      status: 'error',
      message: error.message || 'An unexpected error occurred while sending the email',
    });
  }
};

/**
 * Controller to handle POST /api/v1/send-bulk
 * Note: This endpoint expects JSON, not multipart/form-data for complex batching.
 * Attachments are not supported for send-bulk in this initial version 
 * because it's usually used for personalized emails without identical large files.
 */
const sendBulkEmailsController = async (req, res) => {
  try {
    let emailsData = req.body.emails;

    // 1. Parse 'emails' if it comes as a JSON string
    if (typeof emailsData === 'string') {
      try {
        emailsData = JSON.parse(emailsData);
      } catch (e) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid JSON in "emails" field',
        });
      }
    }

    // 2. Map physical files and global attachments to all emails
    const physicalFiles = req.files || [];
    let globalAttachments = [];

    if (typeof req.body.attachments === 'string') {
      try {
        const parsed = JSON.parse(req.body.attachments);
        globalAttachments = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        globalAttachments = [{ path: req.body.attachments }];
      }
    } else if (Array.isArray(req.body.attachments)) {
      globalAttachments = req.body.attachments;
    } else if (req.body.attachments && typeof req.body.attachments === 'object') {
      globalAttachments = [req.body.attachments];
    }

    if (Array.isArray(emailsData)) {
      emailsData = emailsData.map(email => typeof email === 'string' ? { to: email } : email);
    }

    // 3. Handle RSVP Links
    let rsvpLinks = req.body.rsvp_links;
    if (typeof rsvpLinks === 'string') {
      try { rsvpLinks = JSON.parse(rsvpLinks); } catch (e) { rsvpLinks = [rsvpLinks]; }
    }

    // Mix RSVP links into emails based on index
    if (Array.isArray(rsvpLinks) && Array.isArray(emailsData)) {
      emailsData = emailsData.map((email, idx) => {
        if (rsvpLinks[idx]) {
          return { ...email, rsvp_link: rsvpLinks[idx] };
        }
        return email;
      });
    }

    // 4. Validate Payload
    const validation = batchEmailSchema.safeParse({
      emails: emailsData,
      subject: req.body.subject,
      html: req.body.html,
      rsvp_links: rsvpLinks
    });

    if (!validation.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validation.error.format(),
      });
    }

    // 5. Build Final Emails with Attachments and Template Replacements
    const globalSubject = req.body.subject;
    const globalHtml = req.body.html;

    const finalEmails = validation.data.emails.map(email => {
      // 1. Resolve Subject & HTML
      let subject = email.subject || globalSubject;
      let html = email.html || globalHtml;

      // 2. Replace {{RSVP_LINK}} placeholder if rsvp_link exists
      if (email.rsvp_link && html) {
        html = html.replace(/{{RSVP_LINK}}/g, email.rsvp_link);
      }

      // 3. Merge Attachments
      const emailAttachments = [...(email.attachments || []), ...globalAttachments];
      const physicalAttachments = physicalFiles.map(f => ({
        filename: f.originalname,
        content: f.buffer,
        contentType: f.mimetype
      }));

      return {
        ...email,
        subject,
        html,
        attachments: [...emailAttachments, ...physicalAttachments],
      };
    });

    // 6. Basic Check
    for (let i = 0; i < finalEmails.length; i++) {
      if (!finalEmails[i].subject) return res.status(400).json({ status: 'error', message: `Subject missing for email at index ${i}` });
      if (!finalEmails[i].html) return res.status(400).json({ status: 'error', message: `HTML content missing for email at index ${i}` });
    }

    // 7. Call Service
    const results = await emailService.sendBulkEmails(finalEmails);

    return res.status(200).json({
      status: 'success',
      message: 'Bulk processing completed',
      results,
    });

  } catch (error) {
    console.error('Bulk Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An unexpected error occurred during bulk processing',
    });
  }
};


module.exports = {
  sendEmailController,
  sendBulkEmailsController,
};

