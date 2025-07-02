import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDownloadedFileAction, ConfirmTorrentAction } from "@/types/actions"
import { Description } from "@radix-ui/react-dialog"
import { Dispatch, SetStateAction } from "react"

interface ConfirmDialogProps {
  confirmDialogOpen: boolean
  confirmAction: ConfirmDownloadedFileAction | ConfirmTorrentAction
  dontShowAgain: Record<ConfirmDownloadedFileAction | ConfirmTorrentAction,boolean>
  setDontShowAgain: Dispatch<SetStateAction<Record<ConfirmDownloadedFileAction | ConfirmTorrentAction, boolean>>>
  alertDescriptions: Record<string,string>
  setConfirmDialogOpen: (value: boolean) => void
  executeAction: (action: ConfirmDownloadedFileAction | ConfirmTorrentAction) => Promise<void>
}

const ConfirmDialog = (props: ConfirmDialogProps) => {
  const { confirmDialogOpen,
    confirmAction,
    dontShowAgain,
    setDontShowAgain,
    alertDescriptions,
    setConfirmDialogOpen,
    executeAction,
  } = props

  return (
    <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
      <DialogContent >
        <Description style={{'display': 'none'}}>Confirm Action</Description>
        <DialogHeader>
          <DialogTitle>Confirm Action</DialogTitle>
        </DialogHeader>
        <Alert>
          <AlertTitle>Are you sure?</AlertTitle>
          <AlertDescription>
            {confirmAction ? alertDescriptions[confirmAction] : ""}
          </AlertDescription>
        </Alert>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="dontShowAgain"
            checked={confirmAction ? dontShowAgain[confirmAction] : false}
            onCheckedChange={(checked) => {
              if (confirmAction) {
                dontShowAgain[confirmAction] = checked
              }
              setDontShowAgain(dontShowAgain)
            }}
          />
          <label
            htmlFor="dontShowAgain"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Don&apos;t show this again for {confirmAction}
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
