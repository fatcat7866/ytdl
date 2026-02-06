import { execFile, spawn } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const YTDLP_PATH = process.env.YTDLP_PATH || "yt-dlp";

export interface YtdlpMetadata {
  id: string;
  title: string;
  description: string;
  channel: string;
  channel_id: string;
  thumbnail: string;
  duration: number;
  upload_date: string;
  view_count: number;
  [key: string]: unknown;
}

export async function fetchMetadata(url: string): Promise<YtdlpMetadata> {
  const { stdout } = await execFileAsync(YTDLP_PATH, [
    "--dump-json",
    "--no-download",
    "--no-warnings",
    url,
  ], { timeout: 30000 });

  return JSON.parse(stdout);
}

export async function downloadVideo(
  url: string,
  outputPath: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(YTDLP_PATH, [
      "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
      "--merge-output-format", "mp4",
      "--newline",
      "-o", outputPath,
      url,
    ]);

    proc.stdout.on("data", (data: Buffer) => {
      const line = data.toString();
      const match = line.match(/\[download\]\s+(\d+\.?\d*)%/);
      if (match && onProgress) {
        onProgress(parseFloat(match[1]));
      }
    });

    let stderr = "";
    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`yt-dlp exited with code ${code}: ${stderr}`));
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to spawn yt-dlp: ${err.message}`));
    });
  });
}

export async function isAvailable(): Promise<boolean> {
  try {
    await execFileAsync(YTDLP_PATH, ["--version"], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export async function getVersion(): Promise<string> {
  const { stdout } = await execFileAsync(YTDLP_PATH, ["--version"], { timeout: 5000 });
  return stdout.trim();
}
