/**
 * Main Entry Point - Elysia API Server
 */
import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { bearer } from "@elysiajs/bearer";

import {
  ResponseDto,
  BadRequestError,
  UnauthorizedError,
  RateLimitError,
} from "./shared/response.dto";
import { CommentRepository } from "./adapters/repositories/comment.repository";
import { HoichanRepository } from "./adapters/repositories/hoichan.repository";
import { formRoutes } from "./modules/medical-forms/form.routes";
import { getAuthService, GoogleUserPayload, authRoutes } from "./modules/auth";
import { userRoutes } from "./modules/users";
import { uploadRoutes } from "./modules/upload";
import { cacheRoutes } from "./infrastructure/cache";

// Configuration
const PORT = Number(process.env.PORT || 3002);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || "";

// CORS Origins
const corsOrigins = [
  "http://localhost:3001",
  "https://lolambenhan.vercel.app",
  ...(process.env.CORS_ORIGINS?.split(",").map((s) => s.trim()) || []),
];

// Admin auth utilities
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

export function makeToken(): string {
  const raw = randomBytes(24).toString("hex");
  const sig = createHmac("sha256", ADMIN_TOKEN_SECRET)
    .update(raw)
    .digest("hex");
  return `${raw}.${sig}`;
}

export function verifyToken(token: string): boolean {
  if (!token || !ADMIN_TOKEN_SECRET) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [raw, sig] = parts;
  const expected = createHmac("sha256", ADMIN_TOKEN_SECRET)
    .update(raw)
    .digest("hex");
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

// Rate limiting for chat
const chatRate = new Map<string, { windowStart: number; count: number }>();

function rateLimitChat(ip: string): { ok: boolean; retryAfterSec?: number } {
  const RPM = Number(process.env.CHAT_MAX_RPM || 20);
  const WINDOW = 60_000;
  const now = Date.now();

  const cur = chatRate.get(ip) || { windowStart: now, count: 0 };
  if (now - cur.windowStart >= WINDOW) {
    cur.windowStart = now;
    cur.count = 0;
  }
  cur.count++;
  chatRate.set(ip, cur);

  if (cur.count > RPM) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((WINDOW - (now - cur.windowStart)) / 1000),
    };
  }
  return { ok: true };
}

// ====== Create Elysia App ======
const app = new Elysia({
  prefix: "/apis/v1",
})
  .use(
    cors({
      origin: corsOrigins,
      methods: ["GET", "POST", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: "LoLamBenhAn API",
          version: "2.0.0",
          description: "API cho ứng dụng Bệnh án Điện tử",
        },
      },
      path: "/docs",
    }),
  )
  .use(bearer())
  .onError(({ code, error, set }) => {
    if (error instanceof ResponseDto || "statusCode" in error) {
      const err = error as unknown as {
        statusCode: number;
        code: string;
        message: string;
        details?: unknown;
      };
      set.status = err.statusCode;
      return ResponseDto.error(err.code, err.message, err.details);
    }
    set.status = 500;
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return ResponseDto.error("INTERNAL_ERROR", errorMessage);
  })
  // ====== Health Check ======
  .get("/", () =>
    ResponseDto.success({ message: "LoLamBenhAn API is running" }),
  )
  .get("/health", () => "ok");

// ====== Comments Routes ======
const commentRepo = new CommentRepository();

app.group("/comments", (app) =>
  app
    .get("/", async () => {
      const comments = await commentRepo.findAll(200);
      return ResponseDto.success(comments);
    })
    .post(
      "/",
      async ({ body, request }) => {
        const ip =
          request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
          request.headers.get("x-real-ip") ||
          "unknown";

        const { username, text } = body as { username?: string; text?: string };

        if (!username?.trim()) {
          throw new BadRequestError("Vui lòng nhập nickname");
        }
        if (!text?.trim()) {
          throw new BadRequestError("Vui lòng nhập nội dung góp ý");
        }

        const LIMIT = 5;
        const WINDOW_DAYS = 7;
        const COOLDOWN_SECONDS = 30;

        // Check limit
        const count = await commentRepo.countByIp(ip, WINDOW_DAYS);
        if (count >= LIMIT) {
          throw new RateLimitError(undefined, {
            message:
              "Bạn đã gửi quá 5 góp ý trong 7 ngày qua. Vui lòng thử lại sau.",
          });
        }

        // Check cooldown
        const last = await commentRepo.findLastByIp(ip);
        if (last) {
          const elapsed = Date.now() - last.createdAt.getTime();
          if (elapsed < COOLDOWN_SECONDS * 1000) {
            throw new RateLimitError(
              COOLDOWN_SECONDS - Math.floor(elapsed / 1000),
              {
                message: "Bạn đang góp ý quá nhanh (spam)",
              },
            );
          }
        }

        const comment = await commentRepo.create({
          username: username.trim().slice(0, 50),
          text: text.trim().slice(0, 1000),
          ip,
        });

        return ResponseDto.success({ item: comment });
      },
      {
        body: t.Object({
          username: t.String(),
          text: t.String(),
        }),
      },
    )
    .post("/:id/toggle-heart", async ({ params, bearer }) => {
      if (!bearer || !verifyToken(bearer)) {
        throw new UnauthorizedError();
      }

      const id = Number(params.id);
      if (!Number.isFinite(id)) {
        throw new BadRequestError("Invalid id");
      }

      const comment = await commentRepo.toggleHeart(id);
      if (!comment) {
        throw new BadRequestError("Comment not found");
      }

      return ResponseDto.success({ item: comment });
    })
    .delete("/:id", async ({ params, bearer }) => {
      if (!bearer || !verifyToken(bearer)) {
        throw new UnauthorizedError();
      }

      const id = Number(params.id);
      if (!Number.isFinite(id)) {
        throw new BadRequestError("Invalid id");
      }

      const deleted = await commentRepo.delete(id);
      if (!deleted) {
        throw new BadRequestError("Comment not found");
      }

      return ResponseDto.success({ deleted: true, id });
    }),
);

// ====== Admin Routes ======
app.post(
  "/admin/login",
  async ({ body }) => {
    if (!ADMIN_PASSWORD || !ADMIN_TOKEN_SECRET) {
      throw new BadRequestError("Admin not configured");
    }

    const { password } = body as { password?: string };
    if (password !== ADMIN_PASSWORD) {
      throw new UnauthorizedError("Sai mật khẩu");
    }

    const token = makeToken();
    return ResponseDto.success({ token });
  },
  {
    body: t.Object({
      password: t.String(),
    }),
  },
);

// ====== Chat Route (AI) ======
app.post(
  "/chat",
  async ({ body, request }) => {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rl = rateLimitChat(ip);
    if (!rl.ok) {
      throw new RateLimitError(rl.retryAfterSec);
    }

    const { messages } = body as {
      messages?: Array<{ role: string; content: string }>;
    };

    if (!Array.isArray(messages)) {
      throw new BadRequestError("messages must be an array");
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new BadRequestError("Missing GEMINI_API_KEY");
    }

    // Call Gemini API
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    });

    if (!response.ok) {
      throw new BadRequestError("Gemini API error", {
        status: response.status,
      });
    }

    const data = await response.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return ResponseDto.success({
      answer,
      providerUsed: "gemini",
      modelUsed: "gemini-2.0-flash-exp",
    });
  },
  {
    body: t.Object({
      messages: t.Array(
        t.Object({
          role: t.String(),
          content: t.String(),
        }),
      ),
    }),
  },
);

// ====== Hoichan Repository ======
const hoichanRepo = new HoichanRepository();
const authService = getAuthService();

// ====== Hoichan Routes ======
app.group("/hoichan", (app) =>
  app
    .get("/messages", async () => {
      const messages = await hoichanRepo.findLatest(50);
      return ResponseDto.success(messages.reverse());
    })
    .post(
      "/messages",
      async ({ body, bearer }) => {
        if (!bearer) {
          throw new UnauthorizedError("Missing Google token");
        }

        // Verify Google OAuth token using google-auth-library
        let user: GoogleUserPayload & { isAdmin: boolean };
        try {
          user = await authService.verifyGoogleTokenWithAdmin(bearer);
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Token verification failed";
          throw new UnauthorizedError(message);
        }

        const { text } = body as { text?: string };

        if (!text?.trim()) {
          throw new BadRequestError("Vui lòng nhập nội dung");
        }
        if (text.length > 2000) {
          throw new BadRequestError("Nội dung quá dài (tối đa 2000 ký tự)");
        }

        const message = await hoichanRepo.create({
          sub: user.sub,
          name: user.name,
          isAdmin: user.isAdmin,
          text: text.trim(),
        });

        return ResponseDto.success({ item: message });
      },
      {
        body: t.Object({
          text: t.Optional(t.String()),
        }),
      },
    )
    .post("/messages/:id/heart", async ({ params, body }) => {
      const { sub } = body as { sub?: string };
      if (!sub) {
        throw new BadRequestError("Missing sub");
      }

      const updated = await hoichanRepo.incrementHeart(params.id, sub);
      if (!updated) {
        throw new BadRequestError("Message not found or already hearted");
      }

      return ResponseDto.success({ item: updated });
    })
    .delete("/messages/:id", async ({ params, bearer }) => {
      if (!bearer || !verifyToken(bearer)) {
        throw new UnauthorizedError();
      }

      const deleted = await hoichanRepo.delete(params.id);
      if (!deleted) {
        throw new BadRequestError("Message not found");
      }

      return ResponseDto.success({ deleted: true, id: params.id });
    }),
);

// ====== Auth Routes ======
app.post("/auth/verify", async ({ bearer }) => {
  if (!bearer) {
    throw new UnauthorizedError("Missing Google token");
  }

  try {
    const user = await authService.verifyGoogleTokenWithAdmin(bearer);
    return ResponseDto.success({
      verified: true,
      user: {
        sub: user.sub,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        picture: user.picture,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Token verification failed";
    throw new UnauthorizedError(message);
  }
});

// ====== New Auth Routes (JWT + RBAC) ======
app.use(authRoutes);

// ====== User Management Routes ======
app.use(userRoutes);

// ====== Upload Routes ======
app.use(uploadRoutes);

// ====== Cache Management Routes ======
app.use(cacheRoutes);

// ====== Forms Routes ======
app.use(formRoutes);

// ====== Start Server ======
console.log(`Starting server on port ${PORT}...`);

app.listen(PORT);

console.log(`
   ╔════════════════════════════════════════╗
   ║   🏥 LoLamBenhAn API Server v2.0       ║
   ║                                        ║
   ║   Server: http://localhost:${PORT}        ║
   ║   Docs:   http://localhost:${PORT}/docs   ║
   ╚════════════════════════════════════════╝
`);