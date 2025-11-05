import { IndeterminateProgress } from '@/components/indeterminate-progress'
import { NeuralNetwork } from '@/components/icons/neural-network-icon'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { thinIconStyle } from '@/lib/styling'
import { cn } from '@/lib/utils'
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
          <DialogTitle>
            <div className="flex flex-row items-center justify-start gap-2">
              {suggestionsServiceOnline ? <NeuralNetwork style={thinIconStyle} className="w-4 h-4" /> : ''}
              {title}
            </div>
          </DialogTitle>
        </DialogHeader>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => (e.code == "Enter") && onConfirm()}
        />

        <div className='grid grid-cols-1 gap-0'>
          {suggestionsServiceOnline && suggestions.length == 0 ? (<IndeterminateProgress />) : ""}
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={
                cn(
                  index % 2 === 0 ? 'bg-muted' : '',
                  "p-2 cursor-pointer transition-all duration-500 hover:bg-foreground/20"
                )}
              onClick={() => setNewName(suggestion)}>
              {suggestion}
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
