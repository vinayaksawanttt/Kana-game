import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, speaker = 14, speedScale = 0.95 } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing 'text' parameter." }, { status: 400 });
    }

    const voicevoxHost = process.env.VOICEVOX_HOST || "http://127.0.0.1:50021";

    // Step 1: Generate audio query
    const queryUrl = `${voicevoxHost}/audio_query?text=${encodeURIComponent(text)}&speaker=${speaker}`;
    const queryRes = await fetch(queryUrl, {
      method: "POST",
      signal: AbortSignal.timeout(3000),
    });

    if (!queryRes.ok) {
      return NextResponse.json(
        { error: `VOICEVOX query failed: ${queryRes.status}` },
        { status: 502 }
      );
    }

    const audioQuery = await queryRes.json();
    if (typeof speedScale === "number" && speedScale > 0) {
      audioQuery.speedScale = speedScale;
    }

    // Step 2: Synthesize WAV audio
    const synthUrl = `${voicevoxHost}/synthesis?speaker=${speaker}`;
    const synthRes = await fetch(synthUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(audioQuery),
      signal: AbortSignal.timeout(6000),
    });

    if (!synthRes.ok) {
      return NextResponse.json(
        { error: `VOICEVOX synthesis failed: ${synthRes.status}` },
        { status: 502 }
      );
    }

    const audioBuffer = await synthRes.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "VOICEVOX service unavailable", details: message },
      { status: 503 }
    );
  }
}
