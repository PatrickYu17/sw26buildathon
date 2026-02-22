import type { StreamChunk } from "@/app/lib/api-types";

export async function* streamJsonSse(
  response: Response,
): AsyncGenerator<StreamChunk, void, unknown> {
  if (!response.body) {
    throw new Error("Streaming response body is missing");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    buffer = buffer.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);

      const dataLines: string[] = [];
      for (const line of rawEvent.split("\n")) {
        if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trimStart());
        }
      }

      if (dataLines.length > 0) {
        const data = dataLines.join("\n");
        try {
          yield JSON.parse(data) as StreamChunk;
        } catch {
          // Ignore malformed chunks
        }
      }

      boundary = buffer.indexOf("\n\n");
    }
  }
}
