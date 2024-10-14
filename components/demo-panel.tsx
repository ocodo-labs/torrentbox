import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, WifiOff } from 'lucide-react'

function DemoPanel({tryAgain, startDemo}) {
  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WifiOff className="h-6 w-6" />
          Oops! We&apos;re having a moment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          Looks like we can&apos;t reach the torrent service right now. It&apos;s probably just taking a quick nap.
          Why not grab a refreshing beverage and try again in a little bit? (we&apos;ll try giving it a nudge to wake up.)
        </p>
        <div className="flex gap-4">
          <Button onClick={tryAgain}>
            Try Again
          </Button>
          <Button variant="outline" onClick={startDemo}>
            <Play className="h-4 w-4 mr-2" />
            See Demo
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export { DemoPanel }
