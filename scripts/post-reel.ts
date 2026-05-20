/**
 * Post a Reel to Instagram via the Graph API.
 *
 * Usage:
 *   pnpm reel:post <filename-in-public-reels.mp4> "caption text with #hashtags"
 *
 * Prereq: the file must already be at public/reels/<filename> AND deployed to
 * IG_PUBLIC_BASE_URL (Meta downloads the video from that URL). Commit & push
 * to Vercel first, wait for the deploy to finish, then run this.
 */

const GRAPH_VERSION = "v23.0";
const POLL_INTERVAL_MS = 5_000;
const POLL_MAX_ATTEMPTS = 60; // ~5 minutes

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

async function graph<T>(
  method: "GET" | "POST",
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`);
  const body = new URLSearchParams(params);
  body.set("access_token", env("IG_ACCESS_TOKEN"));

  const res = await fetch(
    method === "GET" ? `${url}?${body}` : url.toString(),
    {
      method,
      body: method === "POST" ? body : undefined,
    },
  );
  const json = (await res.json()) as { error?: { message: string } } & T;
  if (!res.ok || "error" in json) {
    throw new Error(
      `Graph API ${method} ${path} failed: ${JSON.stringify(json)}`,
    );
  }
  return json;
}

async function waitForUrl(url: string): Promise<void> {
  const res = await fetch(url, { method: "HEAD" });
  if (!res.ok) {
    throw new Error(
      `Video not reachable at ${url} (HTTP ${res.status}). Push to Vercel and wait for deploy.`,
    );
  }
}

async function pollContainer(containerId: string): Promise<void> {
  for (let attempt = 1; attempt <= POLL_MAX_ATTEMPTS; attempt++) {
    const { status_code } = await graph<{ status_code: string }>(
      "GET",
      containerId,
      { fields: "status_code" },
    );
    console.log(`  [${attempt}] container status: ${status_code}`);
    if (status_code === "FINISHED") return;
    if (status_code === "ERROR" || status_code === "EXPIRED") {
      throw new Error(`Container ${containerId} failed: ${status_code}`);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error(`Container ${containerId} did not finish within timeout`);
}

async function main() {
  const [filename, ...captionParts] = process.argv.slice(2);
  const caption = captionParts.join(" ");

  if (!filename || !caption) {
    console.error(
      'Usage: pnpm reel:post <filename.mp4> "caption with #hashtags"',
    );
    process.exit(1);
  }

  const igUserId = env("IG_USER_ID");
  const videoUrl = `${env("IG_PUBLIC_BASE_URL")}/reels/${filename}`;

  console.log(`→ Verifying video URL: ${videoUrl}`);
  await waitForUrl(videoUrl);
  console.log("  ✓ reachable\n");

  console.log("→ Creating media container (REELS)…");
  const { id: containerId } = await graph<{ id: string }>(
    "POST",
    `${igUserId}/media`,
    {
      media_type: "REELS",
      video_url: videoUrl,
      caption,
    },
  );
  console.log(`  ✓ container id: ${containerId}\n`);

  console.log("→ Waiting for Meta to ingest the video…");
  await pollContainer(containerId);
  console.log("  ✓ ingested\n");

  console.log("→ Publishing…");
  const { id: mediaId } = await graph<{ id: string }>(
    "POST",
    `${igUserId}/media_publish`,
    { creation_id: containerId },
  );
  console.log(`  ✓ published! media id: ${mediaId}\n`);

  const { permalink } = await graph<{ permalink: string }>(
    "GET",
    mediaId,
    { fields: "permalink" },
  );
  console.log(`🎉 Live: ${permalink}`);
}

main().catch((err) => {
  console.error("\n✗ Failed:", err.message);
  process.exit(1);
});
