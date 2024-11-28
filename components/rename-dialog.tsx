import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableRow, TableCell } from '@/components/ui/table'
import { IndeterminateProgress } from '@/components/indeterminate-progress'

interface RenameDialogProps {
  open: boolean
  onOpenChange: (value: boolean) => void
  newName: string
  setNewName: (value: string | null) => void
  suggestions: string[]
  suggestionsServiceOnline: boolean
  onCancel?: () => void
  onConfirm?: () => void
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
        <DialogHeader>
          <DialogTitle>{title}{suggestionsServiceOnline ? " (AI Suggestions Available)":""}</DialogTitle>
        </DialogHeader>
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Table>
          <TableBody>
            {suggestionsServiceOnline && suggestions.length == 0 ? (<IndeterminateProgress />) : ""}
            {suggestions.map((suggestion, index) => (
              <TableRow key={index} className={index % 2 === 0 ? 'bg-muted' : ''}>
                <TableCell>
                  <Button variant="ghost" onClick={() => setNewName(suggestion)}>
                    {suggestion}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm}>Rename</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { RenameDialog }