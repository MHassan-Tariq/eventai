const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter;

const getTransporter = () => {
  if (!transporter) {
    const { SMTP_HOST, SMTP_PORT, EMAIL_USER, EMAIL_PASS } = process.env;
    
    if (!EMAIL_USER || !EMAIL_PASS) {
      throw new Error('Missing EMAIL_USER or EMAIL_PASS in environment variables.');
    }

    console.log('Attempting login with:', EMAIL_USER.trim());

    const config = {
      auth: {
        user: EMAIL_USER.trim(),
        pass: EMAIL_PASS.trim(), 
      },
    };

    // Use Gmail service preset if host is Gmail, otherwise use manual host/port
    if (SMTP_HOST?.includes('gmail.com')) {
      config.service = 'gmail';
    } else {
      config.host = SMTP_HOST || 'smtp.gmail.com';
      config.port = parseInt(SMTP_PORT) || 587;
      config.secure = (SMTP_PORT == 465);
    }

    transporter = nodemailer.createTransport(config);
  }
  return transporter;
};

/**
 * Sends an email using Nodemailer
 * @param {Object} payload - { to, subject, html, attachments }
 * @returns {Promise<Object>}
 */
const sendEmail = async ({ to, subject, html, attachments }) => {
  try {
    const mailTransporter = getTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER ?? "Zeeshan@solinovation.com",
      to,
      subject,
      html,
    };

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map(file => {
        // Handle Multer file format
        if (file.originalname && file.buffer) {
          return {
            filename: file.originalname,
            content: file.buffer,
            contentType: file.mimetype
          };
        }
        // Handle JSON/Object format (for bulk sending)
        return {
          filename: file.filename,
          content: file.content, // could be base64 string
          path: file.path,       // could be a URL
          contentType: file.contentType
        };
      });
    }
    
    const info = await mailTransporter.sendMail(mailOptions);

    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (err) {
    console.error('Nodemailer Service Exception:', err);
    throw err;
  }
};

/**
 * Sends multiple emails in batch
 * @param {Array} emails - Array of email objects { to, subject, html, attachments }
 * @returns {Promise<Array>} - Array of results
 */
const sendBulkEmails = async (emails) => {
  const results = [];
  for (const emailData of emails) {
    try {
      const result = await sendEmail(emailData);
      results.push({ status: 'success', to: emailData.to, messageId: result.messageId });
    } catch (error) {
      results.push({ status: 'error', to: emailData.to, error: error.message });
    }
  }
  return results;
};

module.exports = {
  sendEmail,
  sendBulkEmails,
};

