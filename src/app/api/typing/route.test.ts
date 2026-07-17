import { describe, test, expect, mock } from "bun:test";
import { NextRequest } from "next/server";
import { POST } from "./route";

mock.module("next/headers", () => {
  return {
    headers: async () => {
      return new Headers();
    },
  };
});

mock.module("@/lib/auth", () => {
  return {
    auth: {
      api: {
        getSession: async () => {
          return {
            user: {
              id: "user-1",
              name: "Haikal",
            },
          };
        },
      },
    },
  };
});

const mockBroadcast = mock();

mock.module("@/lib/sse", () => {
  return {
    broadcastToChannel: mockBroadcast,
  };
});

describe("POST /api/typing", () => {
  test("should return 400 when body input is invalid", async () => {
    const req = new NextRequest("http://localhost:3000/api/typing", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Invalid input");
  });

  test("should broadcast typing status and return 200 when input is valid", async () => {
    mockBroadcast.mockClear();

    const req = new NextRequest("http://localhost:3000/api/typing", {
      method: "POST",
      body: JSON.stringify({
        conversationId: "conv-123",
        isTyping: true,
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.ok).toBe(true);

    expect(mockBroadcast).toHaveBeenCalledTimes(1);
    expect(mockBroadcast).toHaveBeenCalledWith("dm-conv-123", {
      type: "typing",
      userId: "user-1",
      username: "Haikal",
      isTyping: true,
    });
  });
});
