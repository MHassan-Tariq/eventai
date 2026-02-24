const { emailSchema } = require('../validators/emailValidator');
const emailService = require('../services/emailService');

/**
 * Controller to handle POST /api/v1/send-email
 */
const sendEmailController = async (req, res) => {
  try {
    // 1. Validate Payload
    const validation = emailSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validation.error.format(),
      });
    }

    // 2. Call Service
    const result = await emailService.sendEmail({
      ...validation.data,
      attachments: req.files, // Pass physical files from multer
    });

    // 3. Respond
    return res.status(200).json({
      status: 'success',
      message: 'Email sent successfully',
      data: result,
    });

  } catch (error) {
    console.error('Controller Error:', error);
    
    // Distinguish between authentication errors and internal errors
    const statusCode = error.code === 'EAUTH' ? 401 : 500;
    
    return res.status(statusCode).json({
      status: 'error',
      message: error.message || 'An unexpected error occurred while sending the email',
    });
  }
};

module.exports = {
  sendEmailController,
};
