import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-36" />
      </div>

      <Skeleton className="h-10 w-full mb-6" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="pb-3">
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-3 bg-muted/50">
                <Skeleton className="h-8 w-16" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardFooter>
            </Card>
          ))}
      </div>
    </div>
  )
}

