import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ConfirmDialogProps {
  confirmDialogOpen: boolean
  confirmAction: string | null
  dontShowAgain: any
  setDontShowAgain: any
  alertDescriptions: any
  setConfirmDialogOpen: (value: boolean) => void
  executeAction: (action: any) => Promise<void>
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
