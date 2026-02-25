const admin = require('firebase-admin');
require('dotenv').config();
let db;
let auth;

const initializeFirebase = () => {
    try {
        if (admin.apps.length === 0) {
            let serviceAccount;
            if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
                serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
            } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
                let rawKey = process.env.FIREBASE_PRIVATE_KEY;
                
                // Extremely robust PEM reconstruction
                let b64 = rawKey
                    .replace('-----BEGIN PRIVATE KEY-----', '')
                    .replace('-----END PRIVATE KEY-----', '')
                    .replace(/\\n/g, '') // Remove literal \n sequences
                    .replace(/[^A-Za-z0-9+/=]/g, ''); // Remove all other non-base64 characters

                let reconstructed = '-----BEGIN PRIVATE KEY-----\n';
                for (let i = 0; i < b64.length; i += 64) {
                    reconstructed += b64.substring(i, i + 64) + '\n';
                }
                reconstructed += '-----END PRIVATE KEY-----\n';

                serviceAccount = {
                    projectId: process.env.FIREBASE_PROJECT_ID.replace(/"/g, '').trim(),
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL.replace(/"/g, '').trim(),
                    privateKey: reconstructed
                };
            }

            if (serviceAccount) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
                console.log('Firebase Admin initialized successfully.');
            } else {
                console.warn('Firebase configuration missing. Check your .env file.');
                return null;
            }
        }

        db = admin.firestore();
        auth = admin.auth();

        return admin.app();
    } catch (error) {
        console.error('Error initializing Firebase:', error.message);
        return null;
    }
};

// Initialize on load
initializeFirebase();

const logEmailSent = async (emailData, status, info = {}) => {
    if (!db) return;
    try {
        await db.collection('email_logs').add({
            to: emailData.to,
            subject: emailData.subject,
            status: status,
            messageId: info.messageId || null,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            error: info.error || null,
        });
    } catch (error) {
        console.error('Error logging email to Firebase:', error);
    }
};

module.exports = {
    admin,
    getDb: () => db,
    getAuth: () => auth,
    logEmailSent,
};
