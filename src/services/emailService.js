const nodemailer = require('nodemailer');
const axios = require('axios');
require('dotenv').config();
const firebaseService = require('./firebaseService');

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
 * Downloads a file from a URL
 * @param {string} url 
 * @returns {Promise<{buffer: Buffer, contentType: string} | null>}
 */
const downloadFile = async (url) => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
    return {
      buffer: Buffer.from(response.data, 'binary'),
      contentType: response.headers['content-type']
    };
  } catch (error) {
    console.error(`Failed to download file from URL: ${url}`, error.message);
    return null;
  }
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

    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        // 1. Handle Multer file format (Physical files)
        if (file.originalname && file.buffer) {
          realAttachments.push({
            filename: file.originalname,
            content: file.buffer,
            contentType: file.mimetype
          });
          continue;
        }

        // 2. Handle JSON/Object format
        let content = file.content;
        let path = file.path;

        // Detect if it's a URL (either in content or path)
        const isUrl = (val) => typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'));

        const urlToDownload = isUrl(path) ? path : (isUrl(content) ? content : null);

        if (urlToDownload) {
          console.log(`Downloading attachment from: ${urlToDownload}`);
          const downloaded = await downloadFile(urlToDownload);

          if (downloaded) {
            // Extract filename from URL or use default
            const urlPath = new URL(urlToDownload).pathname;
            const filename = file.filename || urlPath.split('/').pop() || 'attachment';

            realAttachments.push({
              filename: filename,
              content: downloaded.buffer,
              contentType: downloaded.contentType || file.contentType
            });
          } else {
            // If download fails, we could fallback to a link, but the user requested physical sending.
            // For now, we'll just skip it or log it.
            console.warn(`Skipping attachment ${urlToDownload} due to download failure.`);
          }
        } else {
          // It's likely a Base64 string or local path
          realAttachments.push({
            filename: file.filename,
            content: content,
            path: path,
            contentType: file.contentType
          });
        }
      }
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

    // Log to Firebase (fire and forget)
    firebaseService.logEmailSent({ to, subject }, 'success', { messageId: info.messageId });

    return info;
  } catch (err) {
    console.error('Nodemailer Service Exception:', err);

    // Log error to Firebase
    firebaseService.logEmailSent({ to, subject }, 'error', { error: err.message });

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

