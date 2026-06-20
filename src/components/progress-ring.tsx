import { useEffect, useState, type FC } from 'react';

interface ProgressRingProps {
  radius: number;
  percentage: number;
  strokeWidth?: number;
  strokeBg?: string;
  strokeFg?: string;
  strokeCap?: "inherit" | "round" | "butt" | "square" | undefined;
}

export const ProgressRing: FC<ProgressRingProps> = ({
  radius = 50,
  percentage = 50,
  strokeBg = "transparent",
  strokeFg = "teal",
  strokeCap = "round",
  strokeWidth = 20
 }) => {
  const [dashArray, setDashArray] = useState<number>();
  const [dashOffset, setDashOffset] = useState<number>();
  const size = () => strokeWidth + (radius * 2)

  useEffect(() => {
    const newDashArray = calculateDasharray(radius);
    const newDashOffset = calculateDashoffset(percentage, newDashArray);
    setDashArray(newDashArray);
    setDashOffset(newDashOffset);
  }, [radius, percentage]);

  const calculateDasharray = (r: number): number => {
    return Math.PI * r * 2;
  };

  const calculateDashoffset = (
    percentageShown: number,
    circumference: number
  ): number => {
    return ((100 - percentageShown) / 100) * circumference;
  };

  return (
    <div>
      <svg
        width={size()}
        height={size()}
        viewBox={`0 0 ${size()} ${size()}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          r={radius}
          cx={strokeWidth / 2 + radius}
          cy={strokeWidth / 2 + radius}
          fill="transparent"
          stroke={strokeBg}
          strokeWidth={strokeWidth}
        ></circle>

        <circle
          id="progress-bar"
          cx={strokeWidth / 2 + radius}
          cy={strokeWidth / 2 + radius}
          fill="transparent"
          stroke={strokeFg}
          strokeWidth={strokeWidth}
          strokeLinecap={strokeCap}
          r={radius}
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
        ></circle>
      </svg>
    </div>
  );
};
