export const thinIconStyle = {
  strokeWidth: 0.75,
}

export const pinnedSearchQueryClasses = `
  relative
  px-3
  py-1
  border-1
  border-primary
  bg-background
  text-xs
  rounded-full
  w-fit
  select-none
  cursor-pointer
`

export const modalContent = "bg-card rounded-lg p-6 w-full h-full md:max-w-4xl relative";
export const modalHeader = "flex flex-row justify-start items-center mb-4 gap-2";
export const modalTitle = "text-xl font-bold tracking-tighter";
export const modalIconButton = 'border border-foregroun/50 hover:bg-background rounded-full p-1 cursor-pointer transition-colors duration-700'
export const modalClose = `${modalIconButton} absolute top-1 right-1`;
export const modalLoadingState = "flex flex-col items-center justify-center py-4 w-full gap-4";
export const modalErrorState = "text-red-500 text-center py-4";
export const modalItemsList = "grid gap-2  max-h-[80vh] overflow-y-auto";
export const modalItemRow = "flex flex-row items-center justify-start gap-2";
export const modalItemInfo = "flex items-center text-[x-small] sm:text-base gap-2";
