import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"

// Initialize Firebase Admin
const apps = getApps()

if (!apps.length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  })
}

const db = getFirestore()
const auth = getAuth()

// Anime functions
export const getAnimeById = async (id: string) => {
  const docRef = db.collection("anime").doc(id)
  const docSnap = await docRef.get()

  if (docSnap.exists) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    }
  }

  return null
}

export const getEpisodeByNumber = async (animeId: string, episodeNumber: number) => {
  const snapshot = await db
    .collection("episodes")
    .where("animeId", "==", animeId)
    .where("episodeNumber", "==", episodeNumber)
    .get()

  if (snapshot.empty) {
    return null
  }

  return {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data(),
  }
}

// User functions
export const getUserById = async (id: string) => {
  try {
    const userRecord = await auth.getUser(id)
    return userRecord
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

// Admin functions
export const getAllAnime = async (limit = 100) => {
  const snapshot = await db.collection("anime").limit(limit).get()

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

export const updateAnime = async (id: string, data: any) => {
  await db
    .collection("anime")
    .doc(id)
    .update({
      ...data,
      updatedAt: new Date(),
    })
}

export const addAnime = async (data: any) => {
  const docRef = await db.collection("anime").add({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return docRef.id
}

export const addEpisode = async (data: any) => {
  const docRef = await db.collection("episodes").add({
    ...data,
    createdAt: new Date(),
  })

  return docRef.id
}
