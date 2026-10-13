import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Description } from '@radix-ui/react-dialog'
import type { Dispatch, SetStateAction } from 'react'
import { useRef } from 'react'
import { useTransmissionContext } from '@/contexts/transmission-provider'

interface RenameDialogProps {
  open: boolean
  onOpenChange: (value: boolean) => void
  newName: string
  setNewName: Dispatch<SetStateAction<string>>
  suggestions: string[]
  onCancel: () => void
  onConfirm: () => void
  title: string
}

export const RenameDialog = (props: RenameDialogProps) => {
  const { open,
    onOpenChange,
    newName,
    setNewName,
    suggestions,
    onCancel,
    onConfirm,
    title } = props

  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          inputRef.current?.focus()
        }}
      >
        <Description style={{ 'display': 'none' }}>Rename</Description>
        <DialogHeader>
          <DialogTitle>
            <div className="flex flex-row items-center justify-start gap-2">
              {title}
            </div>
          </DialogTitle>
        </DialogHeader>
        <Input
          ref={inputRef}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => (e.code == "Enter") && onConfirm()}
        />
        {
          suggestions.length > 0 &&
          <div className='text-sm'>Suggested...</div>
        }
        <div className='grid grid-cols-1 gap-0'>
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
