import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Reclamation } from "@/lib/types";

export const getAllReclamations = async (): Promise<Reclamation[]> => {
  try {
    const users = await getDocs(collection(db, "users"));
    let allReclamations: Reclamation[] = [];
    console.log(`📦 Found ${users.docs.length} users`);

    for (const userDoc of users.docs) {
      const userId = userDoc.id;
      const reclamationsCollection = collection(db, `users/${userId}/Reclamations`);
      const reclamationsSnapshot = await getDocs(reclamationsCollection);
      console.log(`🔍 User ${userId} has ${reclamationsSnapshot.size} reclamations`);

      const userReclamations = await Promise.all(
        reclamationsSnapshot.docs
          .filter((doc) => doc.id !== '!config')
          .map(async (reclamationDoc) => {
            const data = reclamationDoc.data();

            // 🔄 Resolve expediteur
let expediteurName = "unknown";
const rawExpediteur = data.expediteur || data.senderId;

console.log("🔍 Raw expediteur value:", rawExpediteur);

if (rawExpediteur && typeof rawExpediteur === "object" && "id" in rawExpediteur) {
  console.log("📄 Detected DocumentReference for expediteur");

  try {
    const snap = await getDoc(rawExpediteur);
    if (snap.exists()) {
      console.log("✅ Fetched expediteur from DocumentReference:", snap.data());
      expediteurName = snap.data().nom || "no name";
    } else {
      console.warn("⚠️ Expediteur DocumentReference not found");
    }
  } catch (e) {
    console.error("❌ Error fetching expediteur DocumentReference:", e);
  }
} else if (typeof rawExpediteur === "string") {
  console.log("🔗 Detected string UID for expediteur:", rawExpediteur);

  try {
    const snap = await getDoc(doc(db, "users", rawExpediteur));
    if (snap.exists()) {
      console.log("✅ Fetched expediteur from UID:", snap.data());
      expediteurName = snap.data().nom || "no name";
    } else {
      console.warn(`⚠️ No user found with UID: ${rawExpediteur}`);
    }
  } catch (e) {
    console.error("❌ Error fetching expediteur by UID:", e);
  }
}


            // 🔄 Resolve recepteur
            let recepteurName = "Admin";

            return {
              id: reclamationDoc.id,
              expediteur: expediteurName,
              recepteur: recepteurName,
              message: data.contenu || data.message || "",
              date: data.dateReception?.toDate?.() || new Date(),
              resolved: data.status === "resolved",
              userId,
            };
          })
      );

      allReclamations = [...allReclamations, ...userReclamations];
    }

    console.log(`✅ Total reclamations collected: ${allReclamations.length}`);

    return allReclamations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("Error fetching all reclamations:", error);
    throw error;
  }
};

export const updateReclamation = async (
  userId: string, 
  reclamationId: string, 
  data: Partial<Reclamation>
): Promise<void> => {
  try {
    const reclamationDoc = doc(db, `users/${userId}/Reclamations`, reclamationId);
    await updateDoc(reclamationDoc, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating reclamation:", error);
    throw error;
  }
};

export const markReclamationResolved = async (
  userId: string, 
  reclamationId: string, 
  resolved: boolean
): Promise<void> => {
  try {
    const reclamationDoc = doc(db, `users/${userId}/Reclamations`, reclamationId);
    await updateDoc(reclamationDoc, {
      resolved: resolved,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error marking reclamation as resolved:", error);
    throw error;
  }
};

export const deleteReclamation = async (
  userId: string, 
  reclamationId: string
): Promise<void> => {
  try {
    const reclamationDoc = doc(db, `users/${userId}/Reclamations`, reclamationId);
    await deleteDoc(reclamationDoc);
  } catch (error) {
    console.error("Error deleting reclamation:", error);
    throw error;
  }
};

export const getReclamationsCount = async (): Promise<number> => {
  try {
    const users = await getDocs(collection(db, "users"));
    let totalCount = 0;
    
    for (const userDoc of users.docs) {
      const userId = userDoc.id;
      const reclamationsCollection = collection(db, `users/${userId}/Reclamations`);
      const reclamationsSnapshot = await getDocs(reclamationsCollection);
        // ✅ Only count valid documents
      const validReclamations = reclamationsSnapshot.docs.filter(doc => doc.id !== '!config');
      totalCount += validReclamations.length;
      // totalCount += reclamationsSnapshot.size;
    }
    
    return totalCount;
  } catch (error) {
    console.error("Error fetching reclamations count:", error);
    throw error;
  }
};

// export const getReclamationsOverTime = async (): Promise<{ date: string; value: number }[]> => {
//   try {
//     const users = await getDocs(collection(db, "users"));
//     const reclamationsByDate: Record<string, number> = {};

//     for (const userDoc of users.docs) {
//       const userId = userDoc.id;
//       // Use the exact collection name you created in Firestore:
//       const recsCol = collection(db, `users/${userId}/Reclamations`);
//       const recSnap = await getDocs(
//         query(recsCol, orderBy("dateReception", "asc"))
//       );

//       recSnap.docs.forEach(doc => {
//         const data = doc.data();
//         if (data.dateReception) {
//           const dateKey = data
//             .dateReception
//             .toDate()
//             .toISOString()
//             .split("T")[0];
//           reclamationsByDate[dateKey] = (reclamationsByDate[dateKey] || 0) + 1;
//         }
//       });
//     }

//     return Object.entries(reclamationsByDate)
//       .map(([date, value]) => ({ date, value }))
//       .sort((a, b) => a.date.localeCompare(b.date));
//   } catch (err) {
//     console.error("Error fetching reclamations over time:", err);
//     throw err;
//   }
// };
export const getReclamationsOverTime = async (): Promise<{ date: string; value: number }[]> => {
  try {
    const users = await getDocs(collection(db, "users"));
    const reclamationsByDate: Record<string, number> = {};

    for (const userDoc of users.docs) {
      const userId = userDoc.id;
      const recsCol = collection(db, `users/${userId}/Reclamations`);
      const recSnap = await getDocs(query(recsCol, orderBy("dateReception", "asc")));

      recSnap.docs.forEach((doc) => {
        const data = doc.data();
        if (data.dateReception && typeof data.dateReception.toDate === "function") {
          const dateKey = data.dateReception.toDate().toISOString().split("T")[0]; // yyyy-mm-dd
          reclamationsByDate[dateKey] = (reclamationsByDate[dateKey] || 0) + 1;
        } else {
          console.warn("❗ Reclamation missing or malformed dateReception:", doc.id, data);
        }
      });
    }

    const result = Object.entries(reclamationsByDate)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log("✅ Reclamations over time (raw):", result);

    return result;
  } catch (err) {
    console.error("❌ Error fetching reclamations over time:", err);
    throw err;
  }
};

//+++++++++++++++++++++++++++++++++++++
/**
 * Fetch all reclamations across all users
 */
// lib/services/reclamationService.ts
