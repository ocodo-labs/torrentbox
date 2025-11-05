import { useEffect, useState, type FC } from "react";
import styled, { keyframes, css } from "styled-components";

const crtPowerOff = keyframes`
  0% {
    transform: scale(1, 1);
    filter: brightness(100%);
    opacity: 1;
  }
  40% {
    transform: scale(1, 0.05);
    filter: brightness(250%);
  }
  60% {
    transform: scale(0.05, 0.05);
    box-shadow: 0 0 20px 5px white, 0 0 50px 10px #9cf;
  }
  80% {
    transform: scale(0.02);
    filter: brightness(300%) blur(1px);
  }
  100% {
    opacity: 0;
    transform: scale(0);
  }
`;

const crtPowerOn = keyframes`
  0% {
    opacity: 0;
    transform: scale(0);
    filter: brightness(300%) blur(1px);
  }
  20% {
    opacity: 1;
    transform: scale(0.05, 0.05);
  }
  40% {
    transform: scale(1, 0.05);
  }
  100% {
    transform: scale(1, 1);
    filter: brightness(100%);
  }
`;

const Wrapper = styled.div`
  @apply relative overflow-hidden bg-black w-full h-full flex items-center justify-center;
`;

const Img = styled.img<{ state: string; duration: number }>`
  will-change: transform, filter, opacity;
  transform-origin: center center;
  transition: all 0.2s linear;

  ${({ state, duration }) =>
    state === "on"
      ? css`
          animation: ${crtPowerOn} ${duration}ms forwards;
        `
      : state === "off"
        ? css`
          animation: ${crtPowerOff} ${duration}ms forwards;
        `
        : ""}
`;

interface CrtImageProps {
  src: string;
  alt?: string;
  poweredOn?: boolean;
  duration?: number;
  className?: string;
  onPowerOff?: () => void;
}

export const CrtImage: FC<CrtImageProps> = ({
  src,
  alt = "",
  poweredOn = true,
  onPowerOff = () => {},
  duration = 1200,
  className = "",
}) => {
  const [animState, setAnimState] = useState(poweredOn ? "on" : "off");
  useEffect(() => {
    setAnimState(poweredOn ? "on" : "off");
  }, [poweredOn]);



  return (
    <Wrapper
      onClick={() => {
        if (animState === "on") {
          setTimeout(() => {
            onPowerOff();
          }, duration);
        }
        setAnimState(animState === "on" ? "off" : "on");
      }}
      className={className}>
      <Img src={src} alt={alt} state={animState} duration={duration} />
    </Wrapper>
  );
}
