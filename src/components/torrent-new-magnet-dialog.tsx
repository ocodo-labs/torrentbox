import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { Magnet } from "lucide-react"
import { useTransmissionContext } from "@/contexts/transmission-provider"

type TorrentNewMagnetDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const TorrentNewMagnetDialog = ({ open, onOpenChange }: TorrentNewMagnetDialogProps) => {
  const [magnetUrl, setMagnetUrl] = useState("")
  const { addMagnet } = useTransmissionContext()

  const handleAdd = async () => {
    await addMagnet(magnetUrl)
    onOpenChange(false)
    setMagnetUrl("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle><div className="flex"><Magnet className="mr-2 h-6 w-6" style={{strokeWidth:0.5}}/> Add Magnet Link </div></DialogTitle>
        </DialogHeader>
        <Textarea
          className="min-h-[6rem]"
          placeholder="Paste magnet link here..."
          value={magnetUrl}
          onChange={(e) => setMagnetUrl(e.target.value)}
        />
        <DialogFooter className="gap-2">
          <Button onClick={handleAdd}>Add</Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
