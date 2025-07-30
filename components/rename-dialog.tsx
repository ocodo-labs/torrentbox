import { IndeterminateProgress } from '@/components/indeterminate-progress'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Description } from '@radix-ui/react-dialog'
import type { Dispatch, SetStateAction } from 'react'

interface RenameDialogProps {
  open: boolean
  onOpenChange: (value: boolean) => void
  newName: string
  setNewName: Dispatch<SetStateAction<string>>
  suggestions: string[]
  suggestionsServiceOnline: boolean
  onCancel: () => void
  onConfirm: () => void
  title: string
}

const RenameDialog = (props: RenameDialogProps) => {
  const { open,
    onOpenChange,
    newName,
    setNewName,
    suggestionsServiceOnline,
    suggestions,
    onCancel,
    onConfirm,
    title } = props

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <Description style={{ 'display': 'none' }}>Rename</Description>
        <DialogHeader>
          <DialogTitle>{title}{suggestionsServiceOnline ? " (AI Suggestions Available)" : ""}</DialogTitle>
        </DialogHeader>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => (e.code == "Enter") && onConfirm()}
        />

        <div className='grid grid-cols-1 gap-0'>
          {suggestionsServiceOnline && suggestions.length == 0 ? (<IndeterminateProgress />) : ""}
          {suggestions.map((suggestion, index) => (
            <div key={index} className={index % 2 === 0 ? 'bg-muted' : ''}>
              <Button variant="ghost" onClick={() => setNewName(suggestion)}>
                {suggestion}
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm}>Rename</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { RenameDialog }
