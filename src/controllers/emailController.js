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

    // 3. Call Service
    const result = await emailService.sendEmail({
      ...validation.data,
      attachments: req.files, // Pass physical files from multer
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

    // 1. Parse 'emails' if it comes as a JSON string (typical for multipart/form-data)
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

    // 2. Map physical files to email attachments (One file for all emails)
    const physicalFiles = req.files || [];
    if (physicalFiles.length > 0 && Array.isArray(emailsData)) {
      emailsData = emailsData.map(email => {
        // Ensure email.attachments is an array
        if (!email.attachments) email.attachments = [];
        
        // Append all uploaded physical files to this email's attachments
        const physicalAttachments = physicalFiles.map(f => ({
          filename: f.originalname,
          content: f.buffer,
          contentType: f.mimetype
        }));
        
        email.attachments = [...email.attachments, ...physicalAttachments];
        return email;
      });
    }

    // 3. Validate Payload (Transform strings to objects first)
    const validation = batchEmailSchema.safeParse({ 
      emails: emailsData,
      subject: req.body.subject,
      html: req.body.html
    });
    
    if (!validation.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validation.error.format(),
      });
    }

    // 4. Apply Global Subject and HTML to validation data
    const globalSubject = req.body.subject;
    const globalHtml = req.body.html;

    let finalEmails = validation.data.emails.map(email => {
      // email is now guaranteed to be an object by Zod transform
      return {
        ...email,
        subject: email.subject || globalSubject,
        html: email.html || globalHtml
      };
    });

    // 5. Final check for missing subject/html
    for (let i = 0; i < finalEmails.length; i++) {
        if (!finalEmails[i].subject) {
            return res.status(400).json({ status: 'error', message: `Subject missing for email at index ${i}` });
        }
        if (!finalEmails[i].html) {
            return res.status(400).json({ status: 'error', message: `HTML content missing for email at index ${i}` });
        }
    }

    // 6. Call Service
    const results = await emailService.sendBulkEmails(finalEmails);

    // 5. Respond
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

