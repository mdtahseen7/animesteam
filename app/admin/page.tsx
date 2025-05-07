import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { verifyAdminSession } from "@/lib/firebase/admin-auth"

export default async function AdminPage() {
  // Check if user is admin
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get("session")?.value

  if (!sessionCookie) {
    redirect("/login?redirect=/admin")
  }

  try {
    const isAdmin = await verifyAdminSession(sessionCookie)

    if (!isAdmin) {
      redirect("/")
    }

    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex-1">
          <AdminDashboard />
        </div>
        <Footer />
      </main>
    )
  } catch (error) {
    redirect("/login?redirect=/admin")
  }
}
