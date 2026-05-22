const userSubscribers = new Map<string, Set<ReadableStreamDefaultController>>();

export function addUserSubscriber(
  userId: string,
  controller: ReadableStreamDefaultController,
): void {
  if (!userSubscribers.has(userId)) {
    userSubscribers.set(userId, new Set());
  }
  userSubscribers.get(userId)?.add(controller);
}

export function removeUserSubscriber(
  userId: string,
  controller: ReadableStreamDefaultController,
): void {
  const controllers = userSubscribers.get(userId);
  if (!controllers) return;
  controllers.delete(controller);
  if (controllers.size === 0) userSubscribers.delete(userId);
}

export function broadcastToUser(userId: string, data: unknown): void {
  const controllers = userSubscribers.get(userId);
  if (!controllers) return;

  const encoded = new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);

  controllers.forEach((ctrl) => {
    try {
      ctrl.enqueue(encoded);
    } catch {
      controllers.delete(ctrl);
    }
  });
}

if (process.env.NODE_ENV !== "test") {
  const pingData = new TextEncoder().encode(": ping\n\n");

  setInterval(() => {
    userSubscribers.forEach((controllers) => {
      controllers.forEach((ctrl) => {
        try {
          ctrl.enqueue(pingData);
        } catch {
          controllers.delete(ctrl);
        }
      });
    });
  }, 20000);
}
