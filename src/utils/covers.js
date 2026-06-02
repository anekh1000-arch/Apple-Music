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

export const playerCoverImages = [
  "/player-covers/player-01.jpg",
  "/player-covers/player-02.jpg",
  "/player-covers/player-03.jpg",
  "/player-covers/player-04.jpg",
  "/player-covers/player-05.jpg",
  "/player-covers/player-06.jpg",
  "/player-covers/player-07.jpg",
  "/player-covers/player-08.jpg",
  "/player-covers/player-09.jpg",
  "/player-covers/player-10.jpg",
];

export function getCoverForSong(song, index = 0) {
  return coverImages[index % coverImages.length];
}

export function getPlayerCoverForSong(song, index = 0) {
  return playerCoverImages[index % playerCoverImages.length];
}
