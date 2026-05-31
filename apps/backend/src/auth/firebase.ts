import admin from "firebase-admin";
import { env, hasFirebaseCredentials } from "../config/env";

let firebaseReady = false;

function ensureFirebase() {
  if (firebaseReady || !hasFirebaseCredentials) {
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    })
  });

  firebaseReady = true;
}

export type VerifiedIdentity = {
  firebaseUid: string;
  phoneNumber?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
};

export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedIdentity> {
  ensureFirebase();

  if (!firebaseReady) {
    if (env.NODE_ENV === "production") {
      throw new Error("Firebase credentials are not configured. Cannot verify identity token.");
    }
    // Dev/test only: synthetic identity keyed to the token so different tokens
    // produce distinct users. Never reaches this branch in production.
    return {
      firebaseUid: `dev_${idToken.slice(-12)}`,
      phoneNumber: "+91 99999 00000",
      email: "developer@asur.local",
      name: "ASUR Developer"
    };
  }

  const decoded = await admin.auth().verifyIdToken(idToken);
  return {
    firebaseUid: decoded.uid,
    phoneNumber: decoded.phone_number,
    email: decoded.email,
    name: decoded.name,
    avatarUrl: decoded.picture
  };
}
