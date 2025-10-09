import { PinnedQuery } from "@/components/torrent-search/pinned-query";
import { PinnedQueryDragItem } from "@/components/torrent-search/pinned-query-drag-item";
import { usePinnedQueries } from "@/contexts/pinned-queries-context";
import { closestCenter, DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { arrayMove, horizontalListSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { useState, type FC } from "react";

export const PinnedSearchQueries: FC = () => {
  const { setPinnedQueries, pinnedQueries } = usePinnedQueries()
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setPinnedQueries(() => {
        const oldIndex = pinnedQueries.findIndex((v) => active.id === v);
        const newIndex = pinnedQueries.findIndex((v) => over.id === v);
        return arrayMove(pinnedQueries, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  }

  return (
    <div className="flex flex-wrap w-full gap-2 my-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}>

        <SortableContext
          items={pinnedQueries}
          strategy={horizontalListSortingStrategy}
        >
          {
            pinnedQueries.map(
              (query: string) =>
                <PinnedQuery
                  id={query}
                  key={query}
                  query={query}
                />
            )
          }
        </SortableContext>
        <DragOverlay>
          {activeId
            &&
            <PinnedQueryDragItem
              id={activeId}
              query={activeId}
            />
          }
        </DragOverlay>
      </DndContext>
    </div>
  )
}
