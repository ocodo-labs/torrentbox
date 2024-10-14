import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableRow, TableCell } from '@/components/ui/table'

interface RenameDialogProps {
  open: boolean
  onOpenChange: (value: boolean) => void
  newName: string
  setNewName: (value: string | null) => void
  suggestions: string[]
  onCancel?: () => void
  onConfirm?: () => void
  title: string
}

const RenameDialog = (props: RenameDialogProps) => {
  const { open,
    onOpenChange,
    newName,
    setNewName,
    suggestions,
    onCancel,
    onConfirm,
    title } = props

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Table>
          <TableBody>
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