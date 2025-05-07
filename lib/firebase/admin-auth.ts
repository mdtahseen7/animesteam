import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

// Verify session and check if user is admin
export const verifyAdminSession = async (sessionCookie: string) => {
  try {
    const auth = getAuth()
    const db = getFirestore()

    // Verify session
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true)
    const uid = decodedClaims.uid

    // Check if user is admin
    const userDoc = await db.collection("users").doc(uid).get()
    const userData = userDoc.data()

    return userData?.role === "admin"
  } catch (error) {
    console.error("Admin verification error:", error)
    return false
  }
}
