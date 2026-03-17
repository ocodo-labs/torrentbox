import canAutoplay from 'can-autoplay'

// Cache for storing calculated durations
const durationCache = new Map<string, number>();
const lastPlayedMap = new Map<string, number>();
const loadingPromises = new Map<string, Promise<number>>();

const getSoundDuration = (soundPath: string): Promise<number> => {
  // Return cached duration if available
  if (durationCache.has(soundPath)) {
    return Promise.resolve(durationCache.get(soundPath)!);
  }

  // Return existing promise if already loading
  if (loadingPromises.has(soundPath)) {
    return loadingPromises.get(soundPath)!;
  }

  // Load duration
  const loadPromise = new Promise<number>((resolve, reject) => {
    const tempAudio = new Audio(soundPath);

    const cleanup = () => {
      tempAudio.remove();
      loadingPromises.delete(soundPath);
    };

    tempAudio.addEventListener('loadedmetadata', () => {
      const duration = tempAudio.duration * 1000;
      durationCache.set(soundPath, duration);
      cleanup();
      resolve(duration);
    });

    tempAudio.addEventListener('error', (error) => {
      cleanup();
      reject(error);
    });
  });

  loadingPromises.set(soundPath, loadPromise);
  return loadPromise;
};

export const playSound = async (soundPath: string) => {
  try {
    // Get duration (cached or loaded)
    const soundDuration = await getSoundDuration(soundPath);

    // Throttle check
    const now = Date.now();
    const lastPlayed = lastPlayedMap.get(soundPath) || 0;

    if (now - lastPlayed < soundDuration) {
      return; // Throttled - sound is still playing
    }

    // Check autoplay permission and play
    const { result } = await canAutoplay.audio();

    if (result === true) {
      const sound = new Audio(soundPath);

      sound.onplay = () => {
        lastPlayedMap.set(soundPath, Date.now());
      };

      await sound.play();
    }
  } catch (error) {
    console.error('Failed to play sound:', error);
  }
};
