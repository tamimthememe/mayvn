import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, addDoc, getDocs, query } from "firebase/firestore";
import { db } from "./firebase";

export interface UserData {
  uid: string;
  email: string;
  name: string;
  experience?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface BrandData {
  id?: string; // Document ID from Firestore
  brand_name: string;
  tagline?: string;
  brand_values?: string[];
  business_overview?: string;
  colors?: string[];
  fonts?: string[];
  images?: string[];
  logo?: {
    logo: string;
    logo_small: string;
  };
  main_font?: string;
  accent_color?: string;
  target_audience?: string[];
  tone_of_voice?: string[];
  platforms: string[];
  goals: string[];
  company?: string;
  createdAt?: any;
  updatedAt?: any;
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
 * Update user experience (user-level data)
 */
export const updateUserExperience = async (
  uid: string,
  experience: string
): Promise<void> => {
  await updateDoc(doc(db, "users", uid), {
    experience,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Create a brand document in the brands subcollection
 */
export const createBrandDocument = async (
  uid: string,
  brandData: BrandData
): Promise<string> => {
  const brandRef = await addDoc(collection(db, "users", uid, "brands"), {
    ...brandData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return brandRef.id;
};

/**
 * Get all brands for a user
 */
export const getUserBrands = async (uid: string): Promise<BrandData[]> => {
  const brandsRef = collection(db, "users", uid, "brands");
  const brandsSnapshot = await getDocs(brandsRef);

  const brands: BrandData[] = [];
  brandsSnapshot.forEach((doc) => {
    brands.push({
      id: doc.id,
      ...doc.data(),
    } as BrandData);
  });

  return brands;
};

/**
 * Get a specific brand by ID
 */
export const getBrandById = async (uid: string, brandId: string): Promise<BrandData | null> => {
  const brandRef = doc(db, "users", uid, "brands", brandId);
  const brandSnap = await getDoc(brandRef);

  if (brandSnap.exists()) {
    return {
      id: brandSnap.id,
      ...brandSnap.data(),
    } as BrandData;
  }

  return null;
};

// ===== Brand Posts / Drafts =====

export interface BrandPost {
  id?: string;
  title: string;
  caption?: string;
  image?: string;
  status: "draft" | "scheduled" | "published";
  // Stored frames for the post (older docs may use this as an array of objects)
  frames?: any[];
  // New storage format: JSON string of frames to avoid Firestore nested entity issues
  framesJson?: string;
  createdAt?: any;
  updatedAt?: any;
}

export const getBrandPosts = async (
  uid: string,
  brandId: string
): Promise<BrandPost[]> => {
  const postsRef = collection(db, "users", uid, "brands", brandId, "posts");
  const snapshot = await getDocs(postsRef);
  const posts: BrandPost[] = [];
  snapshot.forEach((docSnap) => {
    posts.push({
      id: docSnap.id,
      ...(docSnap.data() as any),
    } as BrandPost);
  });
  return posts;
};

// Recursively remove any fields with value `undefined` so Firestore accepts the data
const deepCleanUndefined = (value: any): any => {
  if (Array.isArray(value)) {
    return value
      .map((v) => deepCleanUndefined(v))
      .filter((v) => v !== undefined);
  }

  if (value !== null && typeof value === "object") {
    const result: Record<string, any> = {};
    Object.entries(value).forEach(([key, val]) => {
      const cleaned = deepCleanUndefined(val);
      if (cleaned !== undefined) {
        result[key] = cleaned;
      }
    });
    return result;
  }

  return value === undefined ? undefined : value;
};

export const saveBrandPost = async (
  uid: string,
  brandId: string,
  postId: string | null,
  data: Omit<BrandPost, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  const postsRef = collection(db, "users", uid, "brands", brandId, "posts");

  // Strip out any fields that are explicitly `undefined` before sending to Firestore
  const cleanedData = deepCleanUndefined(data) as Omit<
    BrandPost,
    "id" | "createdAt" | "updatedAt"
  >;
  const { status, ...rest } = cleanedData;
  const cleanedRest: Record<string, any> = {};
  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanedRest[key] = value;
    }
  });

  if (postId) {
    const postRef = doc(postsRef, postId);
    await updateDoc(postRef, {
      ...cleanedRest,
      ...(status ? { status } : {}),
      updatedAt: serverTimestamp(),
    });
    return postId;
  } else {
    const docRef = await addDoc(postsRef, {
      ...cleanedRest,
      status: status || "draft",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }
};


