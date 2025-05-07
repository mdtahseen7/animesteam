"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { searchAnime } from "@/lib/firebase/client"
import { useDebounce } from "@/hooks/use-debounce"
import Image from "next/image"

interface SearchResult {
  id: string
  title: string
  image: string
}

interface SearchBarProps {
  minimal?: boolean
}

export function SearchBar({ minimal = false }: SearchBarProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebounce(query, 300)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([])
      return
    }

    const fetchResults = async () => {
      setLoading(true)
      try {
        const searchResults = await searchAnime(debouncedQuery)
        setResults(searchResults)
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [debouncedQuery])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
      setOpen(false)
    }
  }

  if (minimal) {
    return (
      <>
        <Button
          variant="outline"
          className="relative w-full justify-start text-sm text-muted-foreground"
          onClick={() => setOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          <span>Search anime...</span>
          <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Search anime..." value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Results">
              {results.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => {
                    router.push(`/anime/${result.id}`)
                    setOpen(false)
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 overflow-hidden rounded">
                      <Image
                        src={result.image || "/placeholder.svg"}
                        alt={result.title}
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span>{result.title}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </>
    )
  }

  return (
    <div className="relative w-full">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 h-12 bg-background/80 border-border/50 focus-visible:ring-primary"
          placeholder="Search for anime..."
          onClick={() => setOpen(true)}
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full aspect-square rounded-none"
            onClick={() => setQuery("")}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear</span>
          </Button>
        )}
      </form>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search anime..." value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Results">
            {results.map((result) => (
              <CommandItem
                key={result.id}
                onSelect={() => {
                  router.push(`/anime/${result.id}`)
                  setOpen(false)
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 overflow-hidden rounded">
                    <Image
                      src={result.image || "/placeholder.svg"}
                      alt={result.title}
                      width={32}
                      height={32}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span>{result.title}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  )
}
