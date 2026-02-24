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
            }
        
            else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
                serviceAccount = {
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                };
            }

            if (serviceAccount) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
                console.log('Firebase Admin initialized successfully.');
            } else {
                console.warn('Firebase configuration missing. Skip initialization.');
                return null;
            }
        }

        db = admin.firestore();
        auth = admin.auth();

        return admin.app();
    } catch (error) {
        console.error('Error initializing Firebase:', error);
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
