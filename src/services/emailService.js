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
    
    let finalHtml = html || '';
    const realAttachments = [];
    const linkAttachments = [];

    if (attachments && attachments.length > 0) {
      attachments.forEach(file => {
        // 1. Handle Multer file format (Physical files) - Keep as real attachment
        if (file.originalname && file.buffer) {
          realAttachments.push({
            filename: file.originalname,
            content: file.buffer,
            contentType: file.mimetype
          });
          return;
        }

        // 2. Handle JSON/Object format
        let content = file.content;
        let path = file.path;

        // Detect if it's a URL (either in content or path)
        const isUrl = (val) => typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'));
        
        if (isUrl(content) || isUrl(path)) {
          linkAttachments.push({
            name: file.filename || 'Attachment',
            url: isUrl(path) ? path : content
          });
        } else {
          // It's likely a Base64 string or local path, keep as real attachment
          realAttachments.push({
            filename: file.filename,
            content: content,
            path: path,
            contentType: file.contentType
          });
        }
      });
    }

    // Append links to HTML body if any
    if (linkAttachments.length > 0) {
      let linksHtml = '<div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd;">';
      linksHtml += '<strong>Attachments:</strong><ul>';
      linkAttachments.forEach(link => {
        linksHtml += `<li><a href="${link.url}">${link.name}</a></li>`;
      });
      linksHtml += '</ul></div>';
      finalHtml += linksHtml;
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER ?? "Zeeshan@solinovation.com",
      to,
      subject,
      html: finalHtml,
      attachments: realAttachments
    };
    
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

