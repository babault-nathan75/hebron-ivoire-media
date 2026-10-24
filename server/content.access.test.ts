import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { isAdminEmail } from "./db";
import { appRouter } from "./routers";

type TestUser = NonNullable<TrpcContext["user"]>;

function createContext(role: TestUser["role"] | null): TrpcContext {
  const user: TestUser | null = role
    ? {
        id: 7,
        openId: "editor-test-user",
        email: "editor@example.test",
        name: "Test Editor",
        loginMethod: "manus",
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }
    : null;

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("content editorial access", () => {
  it("grants no admin rights to unknown emails or without a database (admins live in the database only)", async () => {
    expect(await isAdminEmail("another@example.com")).toBe(false);
    expect(await isAdminEmail(null)).toBe(false);
  });

  it("refuses access to the editorial database for a signed-in non-admin", async () => {
    const caller = appRouter.createCaller(createContext("user"));

    await expect(caller.content.editorialList()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("refuses access to the editorial database when signed out", async () => {
    const caller = appRouter.createCaller(createContext(null));

    await expect(caller.content.editorialList()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("validates article slugs before attempting to persist content", async () => {
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(
      caller.content.saveArticle({
        slug: "Article Invalide!",
        title: "Un titre éditorial valide",
        category: "Actualité",
        excerpt: "Un résumé assez long pour réussir la vérification de longueur.",
        body: "Un texte de démonstration suffisamment long pour passer la vérification minimale.",
        imageUrl: "",
        author: "",
        readMinutes: 4,
        isFeatured: false,
        status: "draft",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
