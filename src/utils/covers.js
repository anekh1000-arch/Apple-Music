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

export function getCoverForSong(song, index = 0) {
  const safeIndex = Number.isFinite(index) && index >= 0 ? index : 0;
  return coverImages[safeIndex % coverImages.length];
}
