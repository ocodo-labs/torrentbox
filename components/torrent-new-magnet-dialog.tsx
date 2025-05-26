import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

import { MagnetIcon } from "@/components/magnet-icon"
import { toast } from "sonner"

type TorrentNewMagnetDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  postUrl: string
}

export const TorrentNewMagnetDialog = ({ open, onOpenChange, postUrl }: TorrentNewMagnetDialogProps) => {
  const [magnetUrl, setMagnetUrl] = useState("")

  const handleAdd = async () => {
    const magnetRegex = /magnet:\?xt=urn:btih:[a-zA-Z0-9]{32,40}(&.+)?$/;
    if (magnetRegex.test(magnetUrl)) {

      try {
        const response = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ magnet_url: magnetUrl }),
        })
        if (!response.ok) {
          toast(`Error Failed to Add Magnet Link`)
        }
        onOpenChange(false)
        setMagnetUrl("")
      } catch (error) {
        toast(`Network Error Adding Magnet Link`)
      }
    } else {
      toast("Invalid Magnet URL")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle><div className="flex"><MagnetIcon className="mr-2"/> Add Magnet Link </div></DialogTitle>
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
