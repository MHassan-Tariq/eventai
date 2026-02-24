const emailService = require('./src/services/emailService');
const nodemailer = require('nodemailer');

// Mock nodemailer
const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: (options) => mockSendMail(options)
  })
}));

async function testAttachments() {
  console.log('--- Testing Attachment Transformation ---');

  const testCases = [
    {
      name: 'Physical File (Multer)',
      attachments: [{ originalname: 'test.pdf', buffer: Buffer.from('abc'), mimetype: 'application/pdf' }],
      expected: [{ filename: 'test.pdf', content: Buffer.from('abc'), contentType: 'application/pdf' }]
    },
    {
      name: 'JSON URL in Content',
      attachments: [{ filename: 'remote.png', content: 'https://example.com/image.png', contentType: 'image/png' }],
      expected: [{ filename: 'remote.png', path: 'https://example.com/image.png', contentType: 'image/png' }]
    },
    {
      name: 'JSON URL in Path',
      attachments: [{ filename: 'remote.png', path: 'https://example.com/image.png', contentType: 'image/png' }],
      expected: [{ filename: 'remote.png', path: 'https://example.com/image.png', contentType: 'image/png' }]
    },
    {
      name: 'Base64 Content',
      attachments: [{ filename: 'base64.txt', content: 'SGVsbG8=', contentType: 'text/plain' }],
      expected: [{ filename: 'base64.txt', content: 'SGVsbG8=', contentType: 'text/plain' }]
    }
  ];

  for (const tc of testCases) {
    console.log(`Testing: ${tc.name}`);
    await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>test</p>',
      attachments: tc.attachments
    });

    const callArgs = mockSendMail.mock.calls[mockSendMail.mock.calls.length - 1][0];
    const actualAttachment = callArgs.attachments[0];

    // Simple validation
    const success = JSON.stringify(actualAttachment) === JSON.stringify(tc.expected[0]);
    if (!success) {
      console.error(`FAILED: ${tc.name}`);
      console.error('Expected:', tc.expected[0]);
      console.error('Actual:', actualAttachment);
    } else {
      console.log(`PASSED: ${tc.name}`);
    }
  }
}

// Since I don't have jest installed easily for a quick run, I'll just write a standalone script that doesn't use jest
const standaloneTestScript = `
const emailService = require('./src/services/emailService');
const nodemailer = require('nodemailer');

// Simple Mock
let lastOptions = null;
nodemailer.createTransport = () => ({
  sendMail: async (options) => {
    lastOptions = options;
    return { messageId: 'test-id' };
  }
});

process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASS = 'testpass';

async function run() {
  const testCases = [
    {
      name: 'Physical File (Multer)',
      attachments: [{ originalname: 'test.pdf', buffer: Buffer.from('abc'), mimetype: 'application/pdf' }],
      validate: (result) => result.filename === 'test.pdf' && result.content.toString() === 'abc'
    },
    {
      name: 'JSON URL in Content',
      attachments: [{ filename: 'remote.png', content: 'https://example.com/image.png', contentType: 'image/png' }],
      validate: (result) => result.path === 'https://example.com/image.png' && result.content === undefined
    },
    {
      name: 'Base64 Content',
      attachments: [{ filename: 'base64.txt', content: 'SGVsbG8=', contentType: 'text/plain' }],
      validate: (result) => result.content === 'SGVsbG8=' && result.path === undefined
    }
  ];

  for (const tc of testCases) {
    await emailService.sendEmail({ to: 'x@y.com', subject: 's', html: 'h', attachments: tc.attachments });
    const actual = lastOptions.attachments[0];
    if (tc.validate(actual)) {
      console.log('PASSED: ' + tc.name);
    } else {
      console.log('FAILED: ' + tc.name);
      console.log('Actual:', actual);
    }
  }
}
run().catch(console.error);
`;

require('fs').writeFileSync('verify_fix.js', standaloneTestScript);
console.log('Verification script created: verify_fix.js');
