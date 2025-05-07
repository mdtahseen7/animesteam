import Link from "next/link"
import { Github } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-6">
      <div className="container px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col items-center md:items-start">
          <Link
            href="/"
            className="font-bold text-lg bg-gradient-to-r from-pink-500 to-purple-500 text-transparent bg-clip-text"
          >
            AnimeStream
          </Link>
          <p className="text-sm text-muted-foreground">Watch anime online for free in HD quality</p>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <Link href="/about" className="hover:text-primary transition-colors">
            About
          </Link>
          <Link href="/contact" className="hover:text-primary transition-colors">
            Contact
          </Link>
          <Link href="/dmca" className="hover:text-primary transition-colors">
            DMCA
          </Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-primary transition-colors">
            Terms
          </Link>
          <a
            href="https://github.com/yourusername/animestream"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </div>
      <div className="container px-4 mt-6 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} AnimeStream. All rights reserved.</p>
        <p className="mt-1">
          Disclaimer: This site does not store any files on its server. All contents are provided by non-affiliated
          third parties.
        </p>
      </div>
    </footer>
  )
}
