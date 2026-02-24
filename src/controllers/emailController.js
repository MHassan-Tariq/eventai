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

    // 2. Map physical files to email attachments
    const physicalFiles = req.files || [];
    if (physicalFiles.length > 0 && Array.isArray(emailsData)) {
      emailsData = emailsData.map(email => {
        if (email.attachments && Array.isArray(email.attachments)) {
          email.attachments = email.attachments.map(att => {
            // If it's a placeholder for a physical file
            const matchedFile = physicalFiles.find(f => f.originalname === att.filename);
            if (matchedFile) {
              return {
                ...att,
                buffer: matchedFile.buffer,
                contentType: matchedFile.mimetype,
                originalname: matchedFile.originalname // For emailService mapping
              };
            }
            return att;
          });
        }
        return email;
      });
    }

    // 3. Validate Payload
    const validation = batchEmailSchema.safeParse({ emails: emailsData });
    
    if (!validation.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validation.error.format(),
      });
    }

    // 4. Call Service
    const results = await emailService.sendBulkEmails(validation.data.emails);

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

