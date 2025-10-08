import { serverBaseUrl } from "@/config"
import { IndeterminateProgress } from "@/components/indeterminate-progress"
import { Input } from "@/components/ui/input"
import { Circle, CircleX, Pin, SearchIcon } from "lucide-react"
import React, { forwardRef, useState, type FC, type HTMLAttributes } from "react"
import { toast } from "sonner"
import { AsycJobLongPressTooltipButton } from "@/components/long-press-tooltip-button"
import { LineMdDownloadIcon } from "@/components/line-md-download-icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { pinnedSearchQueryClasses, thinIconStyle } from "@/lib/styling"
import { playSound } from "@/lib/play-sound"
import { useLocalStorage } from 'usehooks-ts'
import { TooltipCompact } from "@/components/tooltip-compact"

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';

import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';

interface ItemProps extends HTMLAttributes<HTMLDivElement> {
  id: string;
  query: string;
  setSearchQuery: (newValue: string) => void
  unpinQuery: (query: string) => void
}

export const DraggedItem = forwardRef<HTMLDivElement, ItemProps>(
  (
    {
      id,
      query,
      setSearchQuery,
      unpinQuery,
      ...props
    },
    ref) => {
    return (
      <div {...props} ref={ref}>
        <div className={pinnedSearchQueryClasses}>
          <div onDoubleClick={() => setSearchQuery(query)}>
            {query}
          </div>
          <div className="absolute top-[-5px] right-[-6px]">
            <CircleX
              size={16}
              className="bg-background rounded-full p-[1px]"
              onDoubleClick={() => unpinQuery(query)} />
          </div>
        </div>
      </div>
    );
  });

interface PinnedQueryType {
  id: string
  query: string
  setSearchQuery: (newValue: string) => void
  unpinQuery: (query: string) => void
}

export const PinnedQuery: FC<PinnedQueryType> = ({
  id,
  query,
  setSearchQuery,
  unpinQuery
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <DraggedItem
      id={id}
      query={query}
      ref={setNodeRef}
      style={style}
      setSearchQuery={setSearchQuery}
      unpinQuery={unpinQuery}
      {...attributes}
      {...listeners}>
    </DraggedItem >
  )
}

interface PinnedSearchQueriesType {
  queries: string[]
  setQueries: (newValue: string[] | ((queries: string[]) => string[])) => void;
  setSearchQuery: (newValue: string) => void
  unpinQuery: (query: string) => void
}

export const PinnedSearchQueries: FC<PinnedSearchQueriesType> = ({
  queries,
  setQueries,
  setSearchQuery,
  unpinQuery,
}) => {

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active && over) {
      if (active.id !== over.id) {
        setQueries(
          (queries: string[]) => {
            const oldIndex = active.id as number;
            const newIndex = over.id as number;

            return arrayMove<string>(queries, oldIndex, newIndex);
          });
      }
    }
  }

  const [activeId, _] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap w-full gap-2 my-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}>
        <SortableContext
          items={queries}
          strategy={horizontalListSortingStrategy}
        >
          {
            queries.map(
              (query: string, index: number) =>
                <PinnedQuery
                  id={query}
                  key={index}
                  query={query}
                  setSearchQuery={setSearchQuery}
                  unpinQuery={unpinQuery} />
            )
          }
        </SortableContext>
        <DragOverlay>
          {activeId
            &&
            <DraggedItem
              id={activeId}
              query={activeId}
              setSearchQuery={setSearchQuery}
              unpinQuery={unpinQuery}
            />
          }
        </DragOverlay>
      </DndContext>
    </div>
  )
}

interface TorrentSearchResult {
  magnet_link: string
  name: string
  seeds: string
  size: string
  category: string
  existing: string[]
}

interface TorrentSearchResultWithFetchTorrents extends TorrentSearchResult {
  fetchTorrents: () => Promise<void>
}

function TorrentSearchResultRow(props: TorrentSearchResultWithFetchTorrents) {
  const {
    magnet_link,
    name,
    seeds,
    size,
    existing,
    fetchTorrents,
  } = props

  function addedTorrent() {
    console.log('added torrent to transmission')
    playSound("/sounds/torrent-download.mp3")
  }

  async function postTorrentMagnet(name: string, magnet_link: string) {
    try {
      const response = await fetch(
        `${serverBaseUrl}/torrents/magnet/new`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          magnet_url: magnet_link
        })
      })
      if (response.status == 200) {
        await response.json()
        addedTorrent()
        toast(`Added: ${name}`)
        await fetchTorrents()
        return
      } else {
        console.error(`TorrentBox: Failed to add magnet link for ${name}`)
      }
    } catch {
      toast(`Error adding ${name}`)
    } finally {
      return
    }
  }

  return (
    <div className="flex justify-between items-center border-b-2 border-secondary-foreground/10">
      <div className="text-sm w-30 truncate mr-2 md:w-fit md:text-base">
        <div className="flex flex-row gap-2 items-center justify-start">
          {
            existing.length > 0 &&
            <Tooltip>
              <TooltipTrigger>
                <Circle className="w-4 h-4" stroke="#AA6600" strokeWidth={3} />
              </TooltipTrigger>
              <TooltipContent>
                Existing Download: {existing}
              </TooltipContent>
            </Tooltip>
          }
          {
            existing.length == 0 &&
            <Circle className="w-4 h-4" />
          }
          <div>
            {name}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 select-none">
        <div className="text-xs text-muted-foreground">
          {size}
        </div>
        <Tooltip>
          <TooltipTrigger>
            <div className="text-xs w-3">
              {seeds}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Seeds
          </TooltipContent>
        </Tooltip>
        <div className="ml-4 my-[3px]">
          <AsycJobLongPressTooltipButton
            fillColor="bg-primary"
            title={`Download ${name}`}
            onLongPress={() => postTorrentMagnet(name, magnet_link)}
            icon={<LineMdDownloadIcon className="h-4 w-4" style={thinIconStyle} />} />
        </div>
      </div>
    </div>
  )
}

interface TorrentSearchProps {
  fetchTorrents: (...args: unknown[]) => Promise<void>
}

const TorrentSearch: React.FC<TorrentSearchProps> = (props) => {
  const { fetchTorrents } = props
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const noResultsMessage = `No Torrents Found for ${searchQuery}`
  const [pinnedSearchQueries, setPinnedSearchQueries] = useLocalStorage<string[]>('pinned-search-queries', [])

  function resetSearch() {
    setSearchQuery('')
    setSearchResults([])
    setSearching(false)
  }

  function pinQuery() {
    setPinnedSearchQueries(
      Array.from(
        new Set(pinnedSearchQueries.concat(searchQuery))
      )
    )
  }

  function unpinQuery(query: string) {
    setPinnedSearchQueries(
      pinnedSearchQueries.filter((e: string) => e != query)
    )
  }

  async function torrentSearch() {
    if (searchQuery != "") {
      setSearchResults([])
      setSearching(true)
      const query = encodeURIComponent(searchQuery)
      const response = await fetch(
        `${serverBaseUrl}/torrents/search/scrape?query=${query}`
      )
      const data = await response.json()
      if (!response.ok) {
        setSearching(false)
        if (data.detail) { toast(data.detail) }
        return
      }
      if (searchQuery.startsWith('magnet:')) {
        setSearching(false)
        if (data.info) { toast(data.info) }
        return
      }
      if (data?.results?.filter) {
        const filtered = data.results.filter((e: TorrentSearchResult) => {
          const hasSeeds = parseInt(e.seeds, 10) > 0
          const isNotPorn = !e.category
            .toLowerCase()
            .includes("porn")
          return hasSeeds && isNotPorn
        })
        setSearchResults(filtered)
        if (filtered.length == 0) {
          toast.warning(noResultsMessage)
        }
      } else {
        toast.warning(noResultsMessage)
      }
      setSearching(false)
    }
  }

  return (
    <section>
      <div className="flex space-x-4">
        <Input
          className="rounded-full border-foreground/20"
          value={searchQuery}
          placeholder="Search Torrents..."
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={(e) => (e.code == "Enter") && torrentSearch()}
          type="search"
        />
        <div
          className={
            `
            cursor-pointer
            flex flex-row
            items-center
            justify-center
            rounded-full
            px-4
            bg-primary
            hover:bg-primary/70
            text-primary-foreground
            transition-colors
            duration-[1s]
            `
          }
          onClick={torrentSearch}>
          <SearchIcon
            style={thinIconStyle}
            className="mr-2 w-4 h-4"
          />
          Search
        </div>
        {searchQuery != '' && !pinnedSearchQueries
          .map(e => e.toLocaleLowerCase())
          .includes(searchQuery.toLocaleLowerCase()) &&
          <TooltipCompact tooltipChildren={'Pin Query'}>
            <Pin
              onClick={() => pinQuery()}
              className="mt-1 size-6 cursor-pointer"
              style={thinIconStyle} />
          </TooltipCompact>
        }
        <CircleX
          className="mt-1 size-8 cursor-pointer"
          style={thinIconStyle}
          onClick={resetSearch} />
      </div>
      {
        pinnedSearchQueries.length > 0 &&
        <PinnedSearchQueries
          setQueries={setPinnedSearchQueries}
          queries={pinnedSearchQueries}
          setSearchQuery={setSearchQuery}
          unpinQuery={unpinQuery} />
      }

      {
        searchResults.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <h2 className="text-xl font-semibold mb-4">Search Results</h2>
            <div className="grid grid-cols-1">
              {
                searchResults
                  .map(
                    (row: TorrentSearchResult) => (
                      <TorrentSearchResultRow
                        key={row.magnet_link}
                        fetchTorrents={fetchTorrents}
                        {...row}
                      />
                    )
                  )
              }
            </div>
          </div>
        ) : searching ? (
          <div style={{ padding: '1em 0 0 0' }}>
            <IndeterminateProgress />
          </div>
        ) : ''
      }
    </section>
  )
}

export { TorrentSearch }
