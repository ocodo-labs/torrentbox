import { useEffect, useState } from "react";

export function MiniClock({ size = 48, stroke = 0.75 }) {
  const [time, setTime] = useState(new Date());

  // update every second
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const radius = size / 2;
  const cx = radius;
  const cy = radius;

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours() % 12;

  // convert to degrees
  const minDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block" }}
    >
      {/* optional circular outline */}
      <circle
        cx={cx}
        cy={cy}
        r={radius - 1}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
      />

      {/* hour hand */}
      <line
        x1={cx}
        y1={cy}
        x2={cx}
        y2={cy - radius * 0.45}
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap='square'
        transform={`rotate(${hourDeg}, ${cx}, ${cy})`}
      />

      {/* minute hand */}
      <line
        x1={cx}
        y1={cy}
        x2={cx}
        y2={cy - radius * 0.7}
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap='square'
        transform={`rotate(${minDeg}, ${cx}, ${cy})`}
      />

      {/* optional center dot */}
      <circle cx={cx} cy={cy} r="1" strokeWidth={1} fill="currentColor" />
    </svg>
  );
}
