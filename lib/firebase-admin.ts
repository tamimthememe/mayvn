import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Prevent multiple initializations
const getFirebaseAdminApp = () => {
    if (getApps().length > 0) {
        return getApp();
    }

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountKey) {
        try {
            const serviceAccount = JSON.parse(serviceAccountKey);
            return initializeApp({
                credential: cert(serviceAccount),
            });
        } catch (error) {
            console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', error);
        }
    }

    // Fallback or default init
    return initializeApp();
};

const app = getFirebaseAdminApp();
const adminDb = getFirestore(app);

export { adminDb };
