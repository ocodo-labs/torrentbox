import { PinnedQueryDragItem } from "@/components/torrent-search/pinned-query-drag-item"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { FC } from "react"

interface PinnedQueryType {
  id: string
  query: string
}

export const PinnedQuery: FC<PinnedQueryType> = ({
  id,
  query
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.25 : 1,
  };

  return (
    <PinnedQueryDragItem
      id={query}
      query={query}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}>
    </PinnedQueryDragItem>
  )
}