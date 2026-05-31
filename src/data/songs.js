/**
 * Song Data Structure
 * 
 * This file contains sample song data. For production use with real music files:
 * 
 * IMPORTANT: audioUrl Requirements
 * - audioUrl must be a DIRECT playable file URL (ending in .mp3, .wav, .m4a, .ogg, etc.)
 * - Cloud storage preview/share page links (like Mega, Google Drive share pages) will NOT work
 * - Only direct file URLs that the browser can play directly are supported
 * - If a link fails to load, Player.jsx will show an error message in the player area
 * 
 * For local music files:
 * - Place your audio files in the public/music/ folder
 * - Reference them in songs.js using: /music/song-name.mp3
 * - Example: audioUrl: "/music/my-song.mp3"
 * - The /music/ folder is already created in the public directory
 * 
 * For Cloudflare R2 or CDN hosting:
 * - audioUrl can point to Cloudflare R2 public URLs
 * - Recommended file naming: artist-song-title.mp3
 * - Example: audioUrl: "https://your-r2-bucket.com/music/artist-song-title.mp3"
 * 
 * For album cover images:
 * - Place your cover images in the public/covers/ folder
 * - Reference them in songs.js using: /covers/image-name.jpg
 * - Recommended size: 500x500 or 800x800 square
 * - Supported formats: JPG, PNG, WebP
 * - You can also use external URLs for covers
 * - Example: cover: "/covers/album-1.jpg" or cover: "https://example.com/cover.jpg"
 * - The /covers/ folder is already created in the public directory
 * 
 * Audio Quality (Optional field):
 * - Add quality field to indicate audio quality: quality: "320kbps" or quality: "Lossless"
 * - Recommended formats for Apple Music-like quality:
 *   - Best balance: AAC/M4A 256kbps or MP3 320kbps
 *   - Lossless: FLAC (but large files and browser support may vary)
 * 
 * Supported audio sources:
 * - Local files: /music/song-name.mp3 (recommended)
 * - Cloudflare R2: https://your-r2-bucket.com/music/artist-song-title.mp3
 * - Direct file URLs: https://example.com/music/song.mp3
 * - CDN URLs: https://cdn.example.com/audio/song.wav
 * - Public audio hosting: SoundCloud direct links, archive.org direct files, etc.
 * 
 * NOT supported:
 * - Mega share links (not direct playable audio URLs)
 * - Google Drive share pages
 * - Dropbox share links
 * - Any URL that requires authentication or is a preview page
 * 
 * Supported formats: mp3, wav, flac, m4a, ogg
 * 
 * Duration format: "MM:SS" (e.g., "3:45")
 */

export const songs = [
  {
    // Unique identifier for the song
    id: 1,
    // Song title
    title: "Midnight Dreams",
    // Artist name
    artist: "Luna Wave",
    // Album name
    album: "Nocturnal",
    // Duration in MM:SS format
    duration: "3:45",
    // Album art image URL
    cover: "/covers/cover-01.jpg",
    // Audio file URL - replace with your actual audio file
    // Example: "/music/midnight-dreams.mp3" or "https://your-cdn.com/music/midnight-dreams.mp3"
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    // Optional: Audio quality indicator
    quality: "320kbps"
  },
  {
    id: 2,
    title: "Electric Pulse",
    artist: "Neon Flux",
    album: "Digital Age",
    duration: "4:12",
    cover: "/covers/cover-02.jpg",
    // Replace with your actual audio file
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    quality: "320kbps"
  },
  {
    id: 3,
    title: "Ocean Waves",
    artist: "Calm Collective",
    album: "Serenity",
    duration: "5:30",
    cover: "/covers/cover-03.jpg",
    // Replace with your actual audio file
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    quality: "320kbps"
  },
  {
    id: 4,
    title: "City Lights",
    artist: "Urban Echo",
    album: "Metropolis",
    duration: "3:58",
    cover: "/covers/cover-04.jpg",
    // Replace with your actual audio file
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    quality: "320kbps"
  },
  {
    id: 5,
    title: "Starlight Serenade",
    artist: "Cosmic Journey",
    album: "Galaxy",
    duration: "4:45",
    cover: "/covers/cover-05.jpg",
    // Replace with your actual audio file
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    quality: "320kbps"
  },
  {
    id: 6,
    title: "Summer Breeze",
    artist: "Sunny Vibes",
    album: "Warmth",
    duration: "3:22",
    cover: "/covers/cover-06.jpg",
    // Replace with your actual audio file
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    quality: "320kbps"
  },
  {
    id: 7,
    title: "Neon Nights",
    artist: "Synth Wave",
    album: "Retro Future",
    duration: "4:05",
    cover: "/covers/cover-07.jpg",
    // Replace with your actual audio file
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    quality: "320kbps"
  },
  {
    id: 8,
    title: "Mountain High",
    artist: "Nature Sounds",
    album: "Elevation",
    duration: "5:15",
    cover: "/covers/cover-08.jpg",
    // Replace with your actual audio file
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    quality: "Lossless"
  },
  {
    // Example with local audio file path
    id: 9,
    title: "Example Song 1 - Local File",
    artist: "Local Artist",
    album: "Local Album",
    duration: "2:30",
    // Local cover image path - place your cover image in public/covers/ folder
    cover: "/covers/cover-09.jpg",
    // Local file path - place your MP3 file in public/music/ folder
    audioUrl: "/music/sample-1.mp3",
    quality: "320kbps"
  },
  {
    // Example with local audio file path
    id: 10,
    title: "Example Song 2 - Local File",
    artist: "Local Artist",
    album: "Local Album",
    duration: "1:45",
    // Local cover image path - place your cover image in public/covers/ folder
    cover: "/covers/cover-10.jpg",
    // Local file path - place your MP3 file in public/music/ folder
    audioUrl: "/music/sample-2.mp3",
    quality: "Lossless"
  },
  {
    id: 11,
    title: "Aalayal Thara Venam",
    artist: "Masala Coffee",
    album: "Unknown Album",
    duration: "4:15",
    cover: "/covers/cover-11.jpg",
    audioUrl: "/music/Aalayal Thara Venam - Masala Coffee - Official Video HD.mp3",
    quality: "320kbps"
  },
  {
    id: 12,
    title: "Aaranne Aaranne",
    artist: "Prithiviraj, Vidya Balan",
    album: "URUMI",
    duration: "4:30",
    cover: "/covers/cover-12.jpg",
    audioUrl: "/music/Aaranne Aaranne  URUMI  Prithiviraj Santhosh Sivan  Deepak Dev  Prabhu Deva  Vidya Balan.mp3",
    quality: "320kbps"
  },
  {
    id: 13,
    title: "Aaro Nenjil",
    artist: "Shaan Rahman",
    album: "Godha",
    duration: "4:20",
    cover: "/covers/cover-13.jpg",
    audioUrl: "/music/Aaro Nenjil Video Song with Lyrics  Godha Official  Tovino Thomas  Wamiqa Gabbi  Shaan Rahman.mp3",
    quality: "320kbps"
  },
  {
    id: 14,
    title: "Let Me Down Slowly",
    artist: "Alec Benjamin",
    album: "Unknown Album",
    duration: "3:20",
    cover: "/covers/cover-14.jpg",
    audioUrl: "/music/Alec Benjamin - Let Me Down Slowly.mp3",
    quality: "320kbps"
  },
  {
    id: 15,
    title: "Anbarey",
    artist: "Santhosh Narayanan",
    album: "Dhee",
    duration: "4:05",
    cover: "/covers/cover-15.jpg",
    audioUrl: "/music/Anbarey (Lyrics) - Dhee, Santhosh Narayanan.mp3",
    quality: "320kbps"
  },
  {
    id: 16,
    title: "Arikil Pathiye",
    artist: "Unknown Artist",
    album: "Unknown Album",
    duration: "4:35",
    cover: "/covers/cover-16.jpg",
    audioUrl: "/music/Arikil Pathiye.mp3",
    quality: "320kbps"
  },
  {
    id: 17,
    title: "Athiloka Sundhari",
    artist: "Unknown Artist",
    album: "Yodhavu The Warrior",
    duration: "4:10",
    cover: "/covers/cover-17.jpg",
    audioUrl: "/music/Athiloka Sundhari Malayalam Full Video Songᴴᴰ - Yodhavu The Warrior Official #AlluArjun #Yodhavu.mp3",
    quality: "320kbps"
  },
  {
    id: 18,
    title: "Oru Dinam",
    artist: "Mohanlal",
    album: "Big Brother",
    duration: "4:25",
    cover: "/covers/cover-18.jpg",
    audioUrl: "/music/Big Brother Oru Dinam Video Song Mohanlal Siddique Deepak Dev.mp3",
    quality: "320kbps"
  },
  {
    id: 19,
    title: "Cherathukal",
    artist: "Unknown Artist",
    album: "Kumbalangi Nights",
    duration: "4:15",
    cover: "/covers/cover-19.jpg",
    audioUrl: "/music/Cherathukal ചെരാതുകൾ Kumbalangi Nights Official Video Song.mp3",
    quality: "320kbps"
  },
  {
    id: 20,
    title: "Darshana",
    artist: "Unknown Artist",
    album: "Unknown Album",
    duration: "4:50",
    cover: "/covers/cover-20.jpg",
    audioUrl: "/music/Darshana.mp3",
    quality: "320kbps"
  },
  {
    id: 21,
    title: "Bae",
    artist: "Anirudh Ravichander",
    album: "Don",
    duration: "4:00",
    cover: "/covers/cover-21.jpg",
    audioUrl: "/music/Don - Bae (Lyrics)  Sivakarthikeyan, Priyanka Mohan  Anirudh Ravichander  Cibi Chakaravarthi.mp3",
    quality: "320kbps"
  },
  {
    id: 22,
    title: "Guleba",
    artist: "Unknown Artist",
    album: "Gulaebaghavali",
    duration: "4:15",
    cover: "/covers/cover-22.jpg",
    audioUrl: "/music/Gulaebaghavali Guleba.mp3",
    quality: "320kbps"
  },
  {
    id: 23,
    title: "Inkem Inkem",
    artist: "Gopi Sunder",
    album: "Geetha Govindam",
    duration: "4:20",
    cover: "/covers/cover-23.jpg",
    audioUrl: "/music/Inkem Inkem Full Video Song  Geetha Govindam  Vijay Deverakonda, Rashmika, Gopi Sunder.mp3",
    quality: "320kbps"
  },
  {
    id: 24,
    title: "Raave",
    artist: "Unknown Artist",
    album: "Iyobinte Pusthakam",
    duration: "4:30",
    cover: "/covers/cover-24.jpg",
    audioUrl: "/music/Iyobinte Pusthakam - Raave.mp3",
    quality: "320kbps"
  },
  {
    id: 25,
    title: "Kalapakkaara",
    artist: "Jakes Bejoy",
    album: "Unknown Album",
    duration: "4:10",
    cover: "/covers/cover-25.jpg",
    audioUrl: "/music/Jakes Bejoy - Kalapakkaara.mp3",
    quality: "320kbps"
  },
  {
    id: 26,
    title: "Mazhaye Mazhaye",
    artist: "Prithviraj Sukumaran",
    album: "James And Alice",
    duration: "4:25",
    cover: "/covers/cover-26.jpg",
    audioUrl: "/music/James And Alice  Mazhaye Mazhaye HD Song Video  Prithviraj Sukumaran, Vedhika  Official.mp3",
    quality: "320kbps"
  },
  {
    id: 27,
    title: "Johny Mone Johny",
    artist: "Dulquer Salman, Anna Katharina Valayil",
    album: "ABCD",
    duration: "4:25",
    cover: "/covers/cover-27.jpg",
    audioUrl: "/music/Johny Mone Johny  ABCD  Dulquer Salman  Gopi Sundar  Santhosh Varma  Anna Katharina Valayil.mp3",
    quality: "320kbps"
  },
  {
    id: 28,
    title: "Kando Kando",
    artist: "Unknown Artist",
    album: "Big Brother",
    duration: "4:10",
    cover: "/covers/cover-28.jpg",
    audioUrl: "/music/KANDO KANDO BIG BROTHER LOFI.mp3",
    quality: "320kbps"
  },
  {
    id: 29,
    title: "Mazhaneer Thullikal",
    artist: "Unknown Artist",
    album: "Unknown Album",
    duration: "4:35",
    cover: "/covers/cover-29.jpg",
    audioUrl: "/music/Mazhaneer Thullikal.mp3",
    quality: "320kbps"
  },
  {
    id: 30,
    title: "Mel Mel Mel Vinnile",
    artist: "Unknown Artist",
    album: "Usthad Hotel",
    duration: "5:10",
    cover: "/covers/cover-30.jpg",
    audioUrl: "/music/Mel mel mel vinnile- Usthad hotel (lyrics).mp3",
    quality: "320kbps"
  },
  {
    id: 31,
    title: "Minnalvala",
    artist: "Unknown Artist",
    album: "Unknown Album",
    duration: "4:15",
    cover: "/covers/cover-31.jpg",
    audioUrl: "/music/Minnalvala.mp3",
    quality: "320kbps"
  },
  {
    id: 32,
    title: "Neela Nilave",
    artist: "Unknown Artist",
    album: "Unknown Album",
    duration: "4:40",
    cover: "/covers/cover-01.jpg",
    audioUrl: "/music/Neela Nilave.mp3",
    quality: "320kbps"
  },
  {
    id: 33,
    title: "Enthaavo",
    artist: "Nivin Pauly",
    album: "Njandukalude Naattil Oridavela",
    duration: "4:00",
    cover: "/covers/cover-02.jpg",
    audioUrl: "/music/Njandukalude Naattil Oridavela  Enthaavo Song Video  Nivin Pauly  Official.mp3",
    quality: "320kbps"
  },
  {
    id: 34,
    title: "Omanichumma",
    artist: "Gopi Sunder",
    album: "Casanova",
    duration: "5:05",
    cover: "/covers/cover-03.jpg",
    audioUrl: "/music/Omanichumma  Casanova  KarthikVineethNajim ArshadRoopaKalyaniGopi SunderGireesh Puthanchery.mp3",
    quality: "320kbps"
  },
  {
    id: 35,
    title: "En Kadhal Solla",
    artist: "Yuvan Shankar Raja",
    album: "Paiya",
    duration: "4:50",
    cover: "/covers/cover-04.jpg",
    audioUrl: "/music/Paiya - En Kadhal Solla Video  Karthi, Tamannah  Yuvan Shankar Raja.mp3",
    quality: "320kbps"
  },
  {
    id: 36,
    title: "Thuli Thuli",
    artist: "Yuvan Shankar Raja",
    album: "Paiya",
    duration: "4:30",
    cover: "/covers/cover-05.jpg",
    audioUrl: "/music/Paiya - Thuli Thuli Video  Karthi, Tamannah  Yuvan Shankar Raja.mp3",
    quality: "320kbps"
  },
  {
    id: 37,
    title: "Pavizha Mazha",
    artist: "P S Jayhari",
    album: "Athiran",
    duration: "3:45",
    cover: "/covers/cover-06.jpg",
    audioUrl: "/music/Pavizha Mazha  Athiran  Video  Fahad Faasil  Sai Pallavi  Vivek  K S Harisankar  P S Jayhari.mp3",
    quality: "320kbps"
  },
  {
    id: 38,
    title: "Pogiren",
    artist: "Mugen Rao",
    album: "MGR",
    duration: "4:10",
    cover: "/covers/cover-07.jpg",
    audioUrl: "/music/Pogiren song Lyrics mugen rao MGR.mp3",
    quality: "320kbps"
  },
  {
    id: 39,
    title: "Premalu",
    artist: "Unknown Artist",
    album: "Unknown Album",
    duration: "4:15",
    cover: "/covers/cover-08.jpg",
    audioUrl: "/music/Premalu.mp3",
    quality: "320kbps"
  },
  {
    id: 40,
    title: "Malare",
    artist: "Vijay Yesudas",
    album: "Premam",
    duration: "5:15",
    cover: "/covers/cover-09.jpg",
    audioUrl: "/music/Premam Malare Video Song  Rajesh Murugesan  Vijay Yesudas  Nivin Pauly  Sai Pallavi.mp3",
    quality: "320kbps"
  },
  {
    id: 41,
    title: "Puthiyoru Pathayil",
    artist: "Nazriya Nazim",
    album: "Varathan",
    duration: "4:00",
    cover: "/covers/cover-10.jpg",
    audioUrl: "/music/Puthiyoru Pathayil  Varathan  Lyric Video  Fahadh Faasil  Amal Neerad  Nazriya Nazim  ANP&FFF.mp3",
    quality: "320kbps"
  },
  {
    id: 42,
    title: "Unstoppable",
    artist: "Sia",
    album: "Unknown Album",
    duration: "3:35",
    cover: "/covers/cover-11.jpg",
    audioUrl: "/music/Sia - Unstoppable.mp3",
    quality: "320kbps"
  },
  {
    id: 43,
    title: "Parayuvaan",
    artist: "Sid Sriram",
    album: "Unknown Album",
    duration: "4:45",
    cover: "/covers/cover-12.jpg",
    audioUrl: "/music/Sid Sriram - Parayuvaan.mp3",
    quality: "320kbps"
  },
  {
    id: 44,
    title: "Thangamey",
    artist: "Unknown Artist",
    album: "Unknown Album",
    duration: "4:40",
    cover: "/covers/cover-13.jpg",
    audioUrl: "/music/Thangamey.mp3",
    quality: "320kbps"
  },
  {
    id: 45,
    title: "Violin",
    artist: "Unknown Artist",
    album: "Romeo & Juliets",
    duration: "4:30",
    cover: "/covers/cover-14.jpg",
    audioUrl: "/music/Violin Video Song  Romeo & Juliets Malayalam Movie  Allu Arjun  Amala Paul  Iddarammayilatho.mp3",
    quality: "320kbps"
  },
  {
    id: 46,
    title: "Kannukkulle",
    artist: "Vishal Chandrashekhar",
    album: "Unknown Album",
    duration: "4:00",
    cover: "/covers/cover-15.jpg",
    audioUrl: "/music/Vishal Chandrashekhar - Kannukkulle.mp3",
    quality: "320kbps"
  },
  {
    id: 47,
    title: "Ennai Vittu",
    artist: "Yuvanshankar Raja",
    album: "Unknown Album",
    duration: "4:15",
    cover: "/covers/cover-16.jpg",
    audioUrl: "/music/Yuvanshankar Raja - Ennai Vittu.mp3",
    quality: "320kbps"
  },
  {
    id: 48,
    title: "Uyiril Thodum",
    artist: "Sooraj Santhosh",
    album: "Kumbalangi Nights",
    duration: "3:45",
    cover: "/covers/cover-17.jpg",
    audioUrl: "/music/ഉയിരിൽ തൊടും Uyiril Thodum - Kumbalangi Nights Official Video Song  Sooraj Santhosh  Anne Amie.mp3",
    quality: "320kbps"
  }
]
