import { 
  collection, 
  doc, 
  setDoc,
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db,adminAuth } from "@/lib/firebase/config";
import { User, Reclamation } from "@/lib/types";

// 1) Fetch all users
export const getUsers = async (): Promise<User[]> => {
  const usersCol = collection(db, "users");
  const snap = await getDocs(usersCol);

  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      nom: data.nom || "",
      email: data.email || "",
      telephone: data.telephone || "",
      localisation: data.localisation || "",
      date_inscription: data.date_inscription?.toDate() || new Date(),
      derniere_modification: data.derniere_modification?.toDate() || new Date(),
      isBlocked: data.isBlocked ?? false
    };
  });
};

// 2) Fetch one user
export const getUserById = async (id: string): Promise<User|null> => {
  const ref = doc(db, "users", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    id: snap.id,
    nom: data.nom || "",
    email: data.email || "",
    telephone: data.telephone || "",
    localisation: data.localisation || "",
    date_inscription: data.date_inscription?.toDate() || new Date(),
    derniere_modification: data.derniere_modification?.toDate() || new Date(),
    };
};

// 3) Create a new user
export const createUser = async (
  userData: Omit<User, "id" | "date_inscription" | "derniere_modification">,
  password: string
): Promise<string> => {
  // a) create in Auth
  const cred = await createUserWithEmailAndPassword(adminAuth, userData.email, password);

  // b) write the Firestore doc in one go
  const userRef = doc(db, "users", cred.user.uid);
  await setDoc(userRef, {
    nom:                userData.nom,
    email:              userData.email,
    telephone:          userData.telephone,
    localisation:       userData.localisation,
    date_inscription:      serverTimestamp(),
    derniere_modification: serverTimestamp(),
  });


  return cred.user.uid;
};

// 4) Update an existing user
export const updateUser = async (id: string, data: Partial<User>): Promise<void> => {
  const userRef = doc(db, "users", id);
  await updateDoc(userRef, {
    ...data,
    derniere_modification: serverTimestamp()
  });
};

// 5) Delete a user
export const deleteUser = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "users", id));
};

// 6) Count users
export const getUsersCount = async (): Promise<number> => {
  const snap = await getDocs(collection(db, "users"));
  return snap.size;
};

// 7) Time‐series for dashboard
export const getUsersOverTime = async (): Promise<{ date: string; value: number }[]> => {
  const usersCol = collection(db, "users");
  const snap = await getDocs(query(usersCol, orderBy("date_inscription", "asc")));

  const byDate: Record<string, number> = {};
  let total = 0;

  snap.docs.forEach(d => {
    const dt: Timestamp | undefined = d.data().date_inscription as Timestamp;
    if (dt) {
      const day = dt.toDate().toISOString().split("T")[0];
      total += 1;
      byDate[day] = total;
    }
  });

  return Object.entries(byDate)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
};