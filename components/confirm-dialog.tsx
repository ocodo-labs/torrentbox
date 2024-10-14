import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { ConfirmDownloadedFileAction, ConfirmTorrentAction } from "@/types/actions"

interface ConfirmDialogProps {
  confirmDialogOpen: boolean
  setConfirmDialogOpen: (value: boolean) => void
  confirmAction: string
  executeAction: (action: string) => void
  dontShowAgain: { [key: string]: boolean }
  setDontShowAgain: any
  alertDescriptions: { [key: string]: string[] }
}

const ConfirmDialog = (props: ConfirmDialogProps) => {
  const { confirmDialogOpen,
    setConfirmDialogOpen,
    confirmAction,
    executeAction,
    dontShowAgain,
    setDontShowAgain,
    alertDescriptions,
  } = props

  return (
    <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
      <DialogContent >
        <DialogHeader>
          <DialogTitle>Confirm Action</DialogTitle>
        </DialogHeader>
        <Alert>
          <AlertTitle>Are you sure?</AlertTitle>
          <AlertDescription>
            {alertDescriptions[confirmAction]}
          </AlertDescription>
        </Alert>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="dontShowAgain"
            checked={dontShowAgain[confirmAction]}
            onCheckedChange={(checked) =>
              setDontShowAgain((prev: any) => ({ ...prev, [confirmAction]: checked as boolean }))
            }
          />
          <label
            htmlFor="dontShowAgain"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Don't show this again for {confirmAction}
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => executeAction(confirmAction)}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ConfirmDialog }