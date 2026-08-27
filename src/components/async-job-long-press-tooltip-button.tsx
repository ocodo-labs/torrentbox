import { OcodoLoaderIcon } from "@/components/icons/ocodo-loader-icon";
import { type LongPressTooltipButtonProps, LongPressTooltipButton } from "@/components/long-press-tooltip-button";
import { type FC, useState } from "react";

type LongPressAsyncJobTooltipButtonProps = Omit<LongPressTooltipButtonProps, 'onLongPress'> & {
  onLongPress: () => Promise<void>;
};

export const LongPressAsyncJobTooltipButton: FC<LongPressAsyncJobTooltipButtonProps> = ({ onLongPress, ...props }) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const handleLongPress = async () => {
    setIsRunning(true);

    try {
      await onLongPress();
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <>
      {isRunning ? (
        <div className="rounded-full p-1 bg-foreground/20">
          <OcodoLoaderIcon
            className="animate-spin"
            width={`16px`} height={`16px`} />
        </div>
      ) : (
        <LongPressTooltipButton onLongPress={handleLongPress} {...props} />
      )}
    </>
  );
};
