import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export interface UserData {
  uid: string;
  email: string;
  fullName: string;
  createdAt?: any;
  updatedAt?: any;
  onboardingCompleted: boolean;
  platforms: string[];
  goals: string[];
  experience: string;
  company: string;
}

/**
 * Create a new user document in Firestore
 */
export const createUserDocument = async (
  uid: string,
  data: Partial<UserData>
): Promise<void> => {
  await setDoc(doc(db, "users", uid), {
    uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    onboardingCompleted: false,
    platforms: [],
    goals: [],
    experience: "",
    company: "",
    ...data,
  });
};

/**
 * Get a user document from Firestore
 */
export const getUserDocument = async (uid: string): Promise<UserData | null> => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as UserData;
  }
  return null;
};

/**
 * Update a user document in Firestore
 */
export const updateUserDocument = async (
  uid: string,
  data: Partial<UserData>
): Promise<void> => {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Update user onboarding data
 */
export const updateUserOnboarding = async (
  uid: string,
  platforms: string[],
  goals: string[],
  experience: string,
  company: string
): Promise<void> => {
  await updateDoc(doc(db, "users", uid), {
    platforms,
    goals,
    experience,
    company,
    onboardingCompleted: true,
    updatedAt: serverTimestamp(),
  });
};

