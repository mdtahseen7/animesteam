import { put, list, del } from "@vercel/blob"
import { nanoid } from "nanoid"

// Upload a file to Vercel Blob Storage
export async function uploadFile(file: File, folder = "images") {
  try {
    const filename = `${folder}/${nanoid()}-${file.name.replace(/\s+/g, "-")}`
    const { url } = await put(filename, file, {
      access: "public",
    })

    return { url, filename }
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}

// Delete a file from Vercel Blob Storage
export async function deleteFile(filename: string) {
  try {
    await del(filename)
    return true
  } catch (error) {
    console.error("Error deleting file:", error)
    throw error
  }
}

// List files in a folder
export async function listFiles(prefix: string) {
  try {
    const { blobs } = await list({ prefix })
    return blobs
  } catch (error) {
    console.error("Error listing files:", error)
    throw error
  }
}
