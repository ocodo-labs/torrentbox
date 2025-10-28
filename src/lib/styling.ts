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

export const modalContent = "bg-card rounded-lg p-6 w-full h-full relative";
export const modalHeader = "flex flex-row justify-start items-center mb-4 gap-2";
export const modalTitle = "text-xl font-bold tracking-tighter";
export const modalIconButton = 'border border-foreground/50 hover:border-foreground hover:bg-background rounded-full p-1 cursor-pointer transition-colors duration-700'
export const modalClose = `hover:bg-background rounded-full p-1 cursor-pointer
                           transition-colors duration-700 bg-card absolute
                           top-1 right-1
                           sm:top-[-14] sm:right-[-14]
                           w-8 h-8`;
export const modalLoadingState = "flex flex-col items-center justify-center py-4 w-full gap-4";
export const modalErrorState = "text-red-500 text-center py-4";
export const modalItemsList = "grid gap-2  max-h-[80vh] overflow-y-auto";
export const modalContentScrollable = "w-full max-h-[80vh] overflow-y-auto";
export const modalItemRow = "flex flex-row items-center justify-start gap-2";
export const modalItemInfo = "flex items-center text-[x-small] sm:text-base gap-2";
