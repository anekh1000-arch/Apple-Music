const STORAGE_KEYS = {
  theme: "aura_theme",
  favorites: "aura_favorites",
  currentSong: "aura_current_song",
  playbackTime: "aura_playback_time",
  volume: "aura_volume",
  repeatMode: "aura_repeat_mode",
  shuffle: "aura_shuffle",
};

export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
}

export function loadFromStorage(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error("Failed to load from localStorage:", error);
    return fallback;
  }
}

export { STORAGE_KEYS };
