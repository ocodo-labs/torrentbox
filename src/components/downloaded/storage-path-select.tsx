import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { StorageNamePath } from "@/contexts/storage-provider";
import type { Dispatch, FC, SetStateAction } from 'react';
import { useState } from "react"

interface StoragePathSelectProps {
  onPick: Dispatch<SetStateAction<any>>;
  items: StorageNamePath[];
  selectLabel?: string;
  noResultsLabel?: string;
}

export const StoragePathSelect: FC<StoragePathSelectProps> = ({
  items,
  onPick,
  selectLabel = "Select...",
  noResultsLabel = "No results found"
}) => {

  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className="cursor-pointer h-6 rounded-full bg-primary text-xs" variant="outline" role="combobox" aria-expanded={open}>
          {
            value ? items
              .find(i => i.path === value)?.name : selectLabel
          }
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] max-h-[30vh] p-0">
        <Command>
          <CommandInput placeholder={selectLabel} />
          <CommandList>
            <CommandEmpty>{noResultsLabel}</CommandEmpty>
            <CommandGroup>
              {items
                .sort((a, b) => a.path.localeCompare(b.path))
                .map(item => (
                  <CommandItem
                    key={item.path}
                    value={item.path}
                    onSelect={current => {
                      setValue(current)
                      setOpen(false)
                      onPick(item)
                    }}
                  >
                    {item.name}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
