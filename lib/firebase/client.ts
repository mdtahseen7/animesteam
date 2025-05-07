import { initializeApp, getApps, getApp } from "firebase/app"
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore"
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
const db = getFirestore(app)
export const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

// Auth functions
export const loginWithEmail = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password)
}

export const registerWithEmail = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password)
}

export const loginWithGoogle = () => {
  return signInWithPopup(auth, googleProvider)
}

export const logout = () => {
  return signOut(auth)
}

// Anime functions
export const getLatestEpisodes = async (limitCount = 10) => {
  const q = query(collection(db, "episodes"), orderBy("releaseDate", "desc"), limit(limitCount))

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

export const getOngoingAnime = async (limitCount = 10) => {
  const q = query(
    collection(db, "anime"),
    where("status", "==", "Ongoing"),
    orderBy("updatedAt", "desc"),
    limit(limitCount),
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

export const getTrendingAnime = async (limitCount = 10) => {
  const q = query(collection(db, "anime"), orderBy("views", "desc"), limit(limitCount))

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

export const searchAnime = async (query: string, limitCount = 10) => {
  // This is a simple implementation. For production, use Firebase Extensions for full-text search
  // or integrate with Algolia/Elasticsearch
  const q = query.toLowerCase()

  const snapshot = await getDocs(collection(db, "anime"))
  const results = snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter(
      (anime) =>
        anime.title.toLowerCase().includes(q) || anime.genres.some((genre: string) => genre.toLowerCase().includes(q)),
    )
    .slice(0, limitCount)

  return results
}

export const getAnimeById = async (id: string) => {
  const docRef = doc(db, "anime", id)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    }
  }

  return null
}

export const getEpisodesByAnimeId = async (animeId: string) => {
  const q = query(collection(db, "episodes"), where("animeId", "==", animeId), orderBy("episodeNumber", "asc"))

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

export const getEpisodeByNumber = async (animeId: string, episodeNumber: number) => {
  const q = query(
    collection(db, "episodes"),
    where("animeId", "==", animeId),
    where("episodeNumber", "==", episodeNumber),
  )

  const snapshot = await getDocs(q)
  if (snapshot.empty) {
    return null
  }

  return {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data(),
  }
}

export const getRelatedAnime = async (animeId: string, limitCount = 5) => {
  // Get the current anime to find related by genres
  const anime = await getAnimeById(animeId)

  if (!anime) {
    return []
  }

  // Find anime with similar genres
  const q = query(
    collection(db, "anime"),
    where("genres", "array-contains-any", anime.genres),
    limit(limitCount + 1), // +1 to account for the current anime
  )

  const snapshot = await getDocs(q)
  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((relatedAnime) => relatedAnime.id !== animeId)
    .slice(0, limitCount)
}

// User functions
export const addToWatchlist = async (userId: string, animeId: string) => {
  const watchlistRef = doc(db, "users", userId, "watchlist", animeId)
  await updateDoc(watchlistRef, {
    addedAt: serverTimestamp(),
  }).catch(() => {
    // If document doesn't exist, create it
    return addDoc(collection(db, "users", userId, "watchlist"), {
      animeId,
      addedAt: serverTimestamp(),
    })
  })
}

export const removeFromWatchlist = async (userId: string, animeId: string) => {
  const watchlistRef = doc(db, "users", userId, "watchlist", animeId)
  await deleteDoc(watchlistRef)
}

export const checkInWatchlist = async (userId: string, animeId: string) => {
  const watchlistRef = doc(db, "users", userId, "watchlist", animeId)
  const docSnap = await getDoc(watchlistRef)
  return docSnap.exists()
}

export const getUserWatchlist = async (userId: string) => {
  const q = query(collection(db, "users", userId, "watchlist"), orderBy("addedAt", "desc"))

  const snapshot = await getDocs(q)
  const watchlistIds = snapshot.docs.map((doc) => doc.data().animeId)

  // Get full anime details for each ID
  const animeList = await Promise.all(watchlistIds.map((id) => getAnimeById(id)))

  return animeList.filter(Boolean) // Remove any null values
}

export const updateWatchHistory = async (userId: string, animeId: string, episodeNumber: number) => {
  const historyRef = doc(db, "users", userId, "history", `${animeId}_${episodeNumber}`)

  await updateDoc(historyRef, {
    animeId,
    episodeNumber,
    watchedAt: serverTimestamp(),
  }).catch(() => {
    // If document doesn't exist, create it
    return addDoc(collection(db, "users", userId, "history"), {
      animeId,
      episodeNumber,
      watchedAt: serverTimestamp(),
    })
  })
}

export const getUserWatchHistory = async (userId: string, animeId?: string) => {
  let q

  if (animeId) {
    q = query(collection(db, "users", userId, "history"), where("animeId", "==", animeId), orderBy("watchedAt", "desc"))
  } else {
    q = query(collection(db, "users", userId, "history"), orderBy("watchedAt", "desc"))
  }

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

// Comments functions
export const getComments = async (animeId: string, episodeId: string) => {
  const q = query(
    collection(db, "comments"),
    where("animeId", "==", animeId),
    where("episodeId", "==", episodeId),
    orderBy("createdAt", "desc"),
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

export const addComment = async (animeId: string, episodeId: string, userId: string, text: string) => {
  // Get user info
  const userRef = doc(db, "users", userId)
  const userSnap = await getDoc(userRef)
  const userData = userSnap.data()

  const commentData = {
    animeId,
    episodeId,
    userId,
    username: userData?.displayName || "Anonymous",
    userAvatar: userData?.photoURL || null,
    text,
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(collection(db, "comments"), commentData)

  return {
    id: docRef.id,
    ...commentData,
    createdAt: new Date().toISOString(), // Convert for immediate display
  }
}
