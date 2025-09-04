import { AlertTriangle } from "lucide-react"

interface ConnectionErrorPanelProps {
    fetchTorrents: (...args: unknown[]) => void
}

export function ConnectionErrorPanel({ fetchTorrents }: ConnectionErrorPanelProps) {
    return (
        <div className="flex flex-col items-center justify-center h-64 p-6 space-y-4 border rounded-lg border-destructive/50 bg-destructive/10">
            <AlertTriangle className="w-12 h-12 text-destructive" />
            <div className="text-center">
                <h3 className="text-lg font-medium">Media Server Not Connected</h3>
                <p className="text-sm text-muted-foreground">
                    Unable to connect to the media server. Please check your connection and try again.
                </p>
            </div>
            <button
                onClick={fetchTorrents}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
                Try Again
            </button>
        </div>
    )
}
