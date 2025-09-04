import canAutoplay from 'can-autoplay'

export const playSound = (soundPath: string) =>
  canAutoplay.audio().then(({ result }: { result: boolean }) => {
    if (result === true) {
      const sound = new Audio(soundPath);
      sound.play();
    }
  });
