export const coverImages = [
  "/covers/cover-01.jpg",
  "/covers/cover-02.jpg",
  "/covers/cover-03.jpg",
  "/covers/cover-04.jpg",
  "/covers/cover-05.jpg",
  "/covers/cover-06.jpg",
  "/covers/cover-07.jpg",
  "/covers/cover-08.jpg",
  "/covers/cover-09.jpg",
  "/covers/cover-10.jpg",
];

function hashString(str = "") {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function getCoverForSong(song) {
  const stableKey =
    song?.id ||
    song?.fileName ||
    song?.filename ||
    song?.src ||
    song?.url ||
    song?.title ||
    song?.name ||
    "default-song";

  const index = hashString(String(stableKey)) % coverImages.length;

  return coverImages[index];
}
