import { describe, test, expect, mock } from "bun:test";
import { NextRequest } from "next/server";

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
              image: "https://example.com/haikal.pmg",
            },
          };
        },
      },
    },
  };
});

const mockUsers = [
  {
    user: {
      id: "user-2",
      name: "Budi",
      image: "https://example.com/budi.png",
      status: "ACTIVE",
    },
  },
];

mock.module("@/lib/prisma", () => {
  return {
    default: {
      workspaceMember: {
        findMany: async () => {
          return mockUsers;
        },
      },
    },
  };
});

import { GET } from "./route";

describe("GET /api/users", () => {
  test("should return 400 when workspaceId is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/users");
    const response = await GET(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("workspaceId is required");
  });

  test("should return list of users when workspaceId is provided", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/users?workspaceId=ws-999",
    );
    const response = await GET(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].name).toBe("Budi");
    expect(data[0].id).toBe("user-2");
  });
});
