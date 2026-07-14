const globalForSSE = global as unknown as {
  subscribers: Map<string, Set<ReadableStreamDefaultController>>;
};

const subscribers =
  globalForSSE.subscribers ||
  new Map<string, Set<ReadableStreamDefaultController>>();

if (process.env.NODE_ENV !== "production") {
  globalForSSE.subscribers = subscribers;
}

export function addSubscriber(
  channelId: string,
  controller: ReadableStreamDefaultController,
) {
  if (!subscribers.has(channelId)) {
    subscribers.set(channelId, new Set());
  }

  subscribers.get(channelId)?.add(controller);
}

export function removeSubscriber(
  channelId: string,
  controller: ReadableStreamDefaultController,
) {
  const controllers = subscribers.get(channelId);
  if (!controllers) return;

  controllers.delete(controller);

  if (controllers.size === 0) subscribers.delete(channelId);
}

export function broadcastToChannel(channelId: string, data: unknown) {
  const controllers = subscribers.get(channelId);
  if (!controllers) return;

  const encoded = new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
  controllers.forEach((cntrl) => {
    try {
      cntrl.enqueue(encoded);
    } catch (error) {
      controllers.delete(cntrl);
    }
  });
}

if (process.env.NODE_ENV !== "test") {
  const pingData = new TextEncoder().encode(": ping\n\n");

  setInterval(() => {
    subscribers.forEach((controllers) => {
      controllers.forEach((cntrl) => {
        try {
          cntrl.enqueue(pingData);
        } catch {
          controllers.delete(cntrl);
        }
      });
    });
  }, 20000);
}
