import { PinnedQueryDragItem } from "@/components/torrent-search/pinned-query-drag-item"
import { useTorrentSearch } from "@/contexts/torrent-search-context"
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
    searchQuery,
  } = useTorrentSearch()

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

  const isActive =
    searchQuery.trim().toLocaleLowerCase() === query.trim().toLocaleLowerCase()

  return (
    <PinnedQueryDragItem
      id={query}
      query={query}
      ref={setNodeRef}
      style={style}
      isActive={isActive}
      {...attributes}
      {...listeners}>
    </PinnedQueryDragItem>
  )
}