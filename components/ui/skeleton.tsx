import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    // Use data-testid to help prevent browser extensions from adding attributes
    <div
      data-testid="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      suppressHydrationWarning
      {...props}
    />
  )
}

export { Skeleton }
