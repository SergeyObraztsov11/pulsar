/**
 * Copies the five album folders into seed-albums/ with simple names
 * (01.mp3 … N.mp3 + cover.jpg) and writes manifest.json (titles, order, durations).
 * (not imported by db:seed).
 *
 * Usage:
 *   node scripts/prepare-seed-albums.mjs
 *   node scripts/prepare-seed-albums.mjs --source "D:/Music/albums-root"
 *   node scripts/prepare-seed-albums.mjs "D:/Music/albums-root"
 *
 * Default source root: %USERPROFILE%/Desktop or $HOME/Desktop.
 * Sources are copied, never moved. Re-runs overwrite seed-albums album folders.
 */
import { createHash } from "node:crypto";
import { copyFile, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseFile } from "music-metadata";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outRoot = path.join(root, "seed-albums");

/** @typedef {{ sourceFile: string, name: string, isExplicit?: boolean }} TrackDef */

/**
 * Only these five folders. Track order is the real album / compilation order
 * among files present in the source root (titles cleaned from messy ID3 tags).
 */
const ALBUMS = [
  {
    id: "astroworld",
    folder: "astroworld",
    name: "Astroworld",
    releaseDate: "2018-08-03",
    genreIds: ["hip-hop"],
    isExplicit: true,
    sourceDir: "Astroworld (2018) - Travis Scott",
    coverSource: "266112_large.jpg",
    artist: {
      id: "travis-scott",
      name: "Travis Scott",
      email: "travis-scott@example.com",
    },
    /** Official Astroworld order among available tracks; skip duplicate Stargazing (1). */
    tracks: [
      { sourceFile: "Travis Scott - Stargazing (hitmo.net).mp3", name: "Stargazing", isExplicit: true },
      { sourceFile: "Travis Scott - Carousel (hitmo.net).mp3", name: "Carousel", isExplicit: true },
      { sourceFile: "Travis Scott - Sicko Mode (hitmo.net).mp3", name: "Sicko Mode", isExplicit: true },
      { sourceFile: "Travis Scott - R.I.P. Screw (hitmo.net).mp3", name: "R.I.P. Screw", isExplicit: true },
      { sourceFile: "Travis Scott - Stop Trying To Be God (hitmo.net).mp3", name: "Stop Trying To Be God", isExplicit: true },
      { sourceFile: "Travis Scott - No Bystanders (hitmo.net).mp3", name: "No Bystanders", isExplicit: true },
      { sourceFile: "Travis Scott - Skeletons (hitmo.net).mp3", name: "Skeletons", isExplicit: true },
      { sourceFile: "Travis Scott - Wake Up (hitmo.net).mp3", name: "Wake Up", isExplicit: true },
      { sourceFile: "Travis Scott - 5% Tint (hitmo.net).mp3", name: "5% Tint", isExplicit: true },
      { sourceFile: "Travis Scott - Nc-17 (hitmo.net).mp3", name: "NC-17", isExplicit: true },
    ],
  },
  {
    id: "best-of-2017",
    folder: "best-of-2017",
    name: "Best Of 2017",
    releaseDate: "2017-01-01",
    genreIds: ["hip-hop"],
    isExplicit: true,
    sourceDir: "Best Of 2017 - 50 Cent",
    coverSource: "250272_large.jpg",
    artist: {
      id: "50-cent",
      name: "50 Cent",
      email: "50-cent@example.com",
    },
    /**
     * Compilation tracks only. The Get Rich Or Die Tryin' full LP is a different
     * release and is not a Best Of track.
     */
    tracks: [
      { sourceFile: "50 Cent - In Da Club (hitmo.net).mp3", name: "In Da Club", isExplicit: true },
      { sourceFile: "50 Cent, Olivia - Candy Shop (hitmo.net).mp3", name: "Candy Shop", isExplicit: true },
      { sourceFile: "50 Cent, Nate Dogg - 21 Questions (hitmo.net).mp3", name: "21 Questions", isExplicit: true },
      { sourceFile: "50 Cent - P.I.M.P. (hitmo.net).mp3", name: "P.I.M.P.", isExplicit: true },
      { sourceFile: "50 Cent - Disco Inferno (hitmo.net).mp3", name: "Disco Inferno", isExplicit: true },
      { sourceFile: "50 Cent - Just A Lil Bit (hitmo.net).mp3", name: "Just A Lil Bit", isExplicit: true },
      { sourceFile: "50 Cent - Window Shopper (hitmo.net).mp3", name: "Window Shopper", isExplicit: true },
      { sourceFile: "50 Cent - Hustler's Ambition (hitmo.net).mp3", name: "Hustler's Ambition", isExplicit: true },
      { sourceFile: "50 Cent, Mobb Deep - Outta Control (hitmo.net).mp3", name: "Outta Control", isExplicit: true },
      { sourceFile: "50 Cent, Olivia - Best Friend (hitmo.net).mp3", name: "Best Friend", isExplicit: true },
    ],
  },
  {
    id: "greatest-hits-nickelback",
    folder: "greatest-hits-nickelback",
    name: "Greatest Hits",
    releaseDate: "2012-01-01",
    genreIds: ["rock"],
    isExplicit: false,
    sourceDir: "Greatest Hits (2012) - Nickelback",
    coverSource: "323599_large.jpg",
    artist: {
      id: "nickelback",
      name: "Nickelback",
      email: "nickelback@example.com",
    },
    tracks: [
      { sourceFile: "Nickelback - How You Remind Me (hitmo.net).mp3", name: "How You Remind Me" },
      { sourceFile: "Nickelback - Photograph (hitmo.net).mp3", name: "Photograph" },
      { sourceFile: "Nickelback - Someday (hitmo.net).mp3", name: "Someday" },
      { sourceFile: "Nickelback - Never Again (hitmo.net).mp3", name: "Never Again" },
      { sourceFile: "Nickelback - Hero (hitmo.net).mp3", name: "Hero" },
      { sourceFile: "Nickelback - Something In Your Mouth (hitmo.net).mp3", name: "Something In Your Mouth" },
      { sourceFile: "Nickelback - Burn it to the Ground (hitmo.net).mp3", name: "Burn It To The Ground" },
      { sourceFile: "Nickelback - Bottoms Up (hitmo.net).mp3", name: "Bottoms Up" },
      { sourceFile: "Nickelback - When We Stand Together (hitmo.net).mp3", name: "When We Stand Together" },
      { sourceFile: "Nickelback - Follow You Home (hitmo.net).mp3", name: "Follow You Home" },
    ],
  },
  {
    id: "nevermind",
    folder: "nevermind",
    name: "Nevermind",
    releaseDate: "1991-09-24",
    genreIds: ["rock"],
    isExplicit: false,
    sourceDir: "Nirvana 1991 - Nevermind",
    coverSource: "Nirvana - Nevermind (cover).png",
    artist: {
      id: "nirvana",
      name: "Nirvana",
      email: "nirvana@example.com",
    },
    tracks: [
      { sourceFile: "01. Smells Like Teen Spirit.mp3", name: "Smells Like Teen Spirit" },
      { sourceFile: "02. In Bloom.mp3", name: "In Bloom" },
      { sourceFile: "03. Come As You Are.mp3", name: "Come As You Are" },
      { sourceFile: "04. Breed.mp3", name: "Breed" },
      { sourceFile: "05. Lithium.mp3", name: "Lithium" },
      { sourceFile: "06. Polly.mp3", name: "Polly" },
      { sourceFile: "07. Territorial Pissings.mp3", name: "Territorial Pissings" },
      { sourceFile: "08. Drain You.mp3", name: "Drain You" },
      { sourceFile: "09. Lounge Act.mp3", name: "Lounge Act" },
      { sourceFile: "10. Stay Away.mp3", name: "Stay Away" },
      { sourceFile: "11. On A Plain.mp3", name: "On A Plain" },
      { sourceFile: "12. Something In The Way.mp3", name: "Something In The Way" },
    ],
  },
  {
    id: "this-and-that",
    folder: "this-and-that",
    name: "This & That",
    releaseDate: "2026-01-01",
    genreIds: ["pop"],
    isExplicit: false,
    sourceDir: "This & That (2026) - Stray Kids",
    coverSource: "508580_large.jpg",
    artist: {
      id: "stray-kids",
      name: "Stray Kids",
      email: "stray-kids@example.com",
    },
    /** Title track first, then remaining EP cuts as present in the source folder. */
    tracks: [
      { sourceFile: "Stray Kids - This   That (hitmo.net).mp3", name: "This & That" },
      { sourceFile: "Stray Kids - After You (hitmo.net).mp3", name: "After You" },
      { sourceFile: "Stray Kids - I Do (hitmo.net).mp3", name: "I Do" },
      { sourceFile: "Stray Kids - Way Out (hitmo.net).mp3", name: "Way Out" },
      { sourceFile: "Stray Kids - Back Then (hitmo.net).mp3", name: "Back Then" },
      { sourceFile: "Stray Kids - Farming (hitmo.net).mp3", name: "Farming" },
      { sourceFile: "Stray Kids - Run It (hitmo.net).mp3", name: "Run It" },
    ],
  },
];

function resolveSourceRoot(argv) {
  const args = argv.slice(2);
  const eq = args.find((a) => a.startsWith("--source="));
  if (eq) return path.resolve(eq.slice("--source=".length));

  const flagIdx = args.indexOf("--source");
  if (flagIdx !== -1) {
    const value = args[flagIdx + 1];
    if (!value || value.startsWith("-")) {
      throw new Error("Missing path after --source");
    }
    return path.resolve(value);
  }

  const positional = args.find((a) => !a.startsWith("-"));
  if (positional) return path.resolve(positional);

  const home = process.env.USERPROFILE || process.env.HOME;
  if (!home) {
    throw new Error(
      "Cannot resolve Desktop: set USERPROFILE/HOME or pass --source <dir>",
    );
  }
  return path.join(home, "Desktop");
}

function padTrack(n) {
  return String(n).padStart(2, "0");
}

async function sha256File(filePath) {
  const buf = await readFile(filePath);
  return createHash("sha256").update(buf).digest("hex");
}

async function durationSecOf(filePath) {
  const meta = await parseFile(filePath);
  const sec = meta.format.duration;
  if (sec == null || !Number.isFinite(sec) || sec < 0) {
    throw new Error(`No duration for ${filePath}`);
  }
  return Math.round(sec);
}

async function writeCoverJpg(sourcePath, destPath) {
  await sharp(sourcePath)
    .rotate()
    .resize(800, 800, { fit: "cover" })
    .jpeg({ quality: 90 })
    .toFile(destPath);
}

async function prepareAlbum(album, sourceRoot) {
  const sourceDir = path.join(sourceRoot, album.sourceDir);
  const destDir = path.join(outRoot, album.folder);
  await mkdir(destDir, { recursive: true });

  const sourceNames = new Set(await readdir(sourceDir));
  const missing = [];
  if (!sourceNames.has(album.coverSource)) missing.push(album.coverSource);
  for (const track of album.tracks) {
    if (!sourceNames.has(track.sourceFile)) missing.push(track.sourceFile);
  }
  if (missing.length) {
    throw new Error(
      `Missing files in ${album.sourceDir}:\n- ${missing.join("\n- ")}`,
    );
  }

  const coverSrc = path.join(sourceDir, album.coverSource);
  const coverDest = path.join(destDir, "cover.jpg");
  await writeCoverJpg(coverSrc, coverDest);
  const coverStat = await stat(coverDest);

  const tracks = [];
  for (let i = 0; i < album.tracks.length; i += 1) {
    const def = album.tracks[i];
    const trackNumber = i + 1;
    const destName = `${padTrack(trackNumber)}.mp3`;
    const srcPath = path.join(sourceDir, def.sourceFile);
    const destPath = path.join(destDir, destName);
    await copyFile(srcPath, destPath);

    const [srcStat, destStat, durationSec, srcHash, destHash] = await Promise.all([
      stat(srcPath),
      stat(destPath),
      durationSecOf(destPath),
      sha256File(srcPath),
      sha256File(destPath),
    ]);

    if (srcStat.size !== destStat.size || srcHash !== destHash) {
      throw new Error(`Copy mismatch for ${def.sourceFile}`);
    }

    tracks.push({
      id: `${album.id}-${padTrack(trackNumber)}`,
      trackNumber,
      name: def.name,
      file: destName,
      sourceFile: def.sourceFile,
      durationSec,
      sizeBytes: destStat.size,
      sha256: destHash,
      isExplicit: def.isExplicit ?? album.isExplicit,
    });

    console.log(
      `  ${destName} ← ${def.sourceFile} (${destStat.size} bytes, ${durationSec}s)`,
    );
  }

  return {
    id: album.id,
    folder: album.folder,
    name: album.name,
    releaseDate: album.releaseDate,
    genreIds: album.genreIds,
    isExplicit: album.isExplicit,
    coverFile: "cover.jpg",
    coverSizeBytes: coverStat.size,
    artist: album.artist,
    sourceDir: album.sourceDir,
    tracks,
  };
}

async function main() {
  const sourceRoot = resolveSourceRoot(process.argv);
  console.log(`Source root: ${sourceRoot}`);

  await mkdir(outRoot, { recursive: true });
  const albums = [];

  for (const album of ALBUMS) {
    console.log(`\n=== ${album.name} (${album.sourceDir}) ===`);
    albums.push(await prepareAlbum(album, sourceRoot));
  }

  const albumBytes = albums.reduce(
    (n, a) => n + a.coverSizeBytes + a.tracks.reduce((s, t) => s + t.sizeBytes, 0),
    0,
  );
  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceRoot,
    note: "Local seed media for Pulsar. Album tracks are imported by npm run db:seed.",
    albums,
    totals: {
      albumTrackCount: albums.reduce((n, a) => n + a.tracks.length, 0),
      albumBytes,
      totalBytes: albumBytes,
    },
  };

  const manifestPath = path.join(outRoot, "manifest.json");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(`\nWrote ${manifestPath}`);
  console.log(
    `Albums: ${albums.length}, tracks: ${manifest.totals.albumTrackCount}, album bytes: ${albumBytes}`,
  );
  console.log(`Total bytes: ${manifest.totals.totalBytes}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
