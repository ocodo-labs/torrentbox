import { type FC } from "react";
import styled, { keyframes } from "styled-components";

// Define the animation
const indeterminateAnimation = keyframes`
  0% {
    transform: translateX(0) scaleX(0);
  }

  40% {
    transform: translateX(0) scaleX(0.4);
  }

  100% {
    transform: translateX(100%) scaleX(0.5);
  }
`;

// Styled components for the progress bar
const ProgressBar = styled.div`
  background-color: var(--border);
  width: 100%;
  border-radius: 0.25em;
  height: 0.5em;
  overflow: hidden;
`;

const ProgressBarValue = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 0.25em;
  background-color: var(--primary);
  box-shadow: inset 0 0 3px 3px #FFF4;
  animation: ${indeterminateAnimation} 3s infinite linear;
  transform-origin: 0% 50%;
`;

export const IndeterminateProgress: FC = () => (
  <ProgressBar>
    <ProgressBarValue />
  </ProgressBar>
);
