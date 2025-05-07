import { type NextRequest, NextResponse } from "next/server"
import { uploadFile } from "@/lib/blob-storage"
import { verifyAdminSession } from "@/lib/firebase/admin-auth"

export async function POST(request: NextRequest) {
  try {
    // Verify admin session
    const sessionCookie = request.cookies.get("session")?.value

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = await verifyAdminSession(sessionCookie)

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = (formData.get("folder") as string) || "images"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const { url, filename } = await uploadFile(file, folder)

    return NextResponse.json({ url, filename })
  } catch (error: any) {
    console.error("Error in upload API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
