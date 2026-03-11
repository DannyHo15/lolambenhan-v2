/**
 * Main Entry Point - Elysia API Server
 * Clean Architecture Implementation
 */
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { bearer } from "@elysiajs/bearer";

// Shared
import { ResponseDto } from "./shared/response.dto";

// Domain
import type { ICommentRepository } from "./domain/repositories/comment.repository.interface";
import type { IHoichanRepository } from "./domain/repositories/hoichan-message.repository.interface";

// Infrastructure
import { GeminiChatProvider } from "./infrastructure/external/gemini.provider";

// Interfaces - Persistence
import { CommentRepositoryImpl } from "./interfaces/persistence/repositories/comment.repository.impl";
import { HoichanMessageRepositoryImpl } from "./interfaces/persistence/repositories/hoichan-message.repository.impl";

// Interfaces - HTTP Controllers
import { CommentController } from "./interfaces/http/controllers/comment.controller";
import { HoichanController } from "./interfaces/http/controllers/hoichan.controller";
import { ChatController } from "./interfaces/http/controllers/chat.controller";
import { AdminController } from "./interfaces/http/controllers/admin.controller";

// Modules (keeping existing feature modules)
import { getAuthService, GoogleUserPayload, authRoutes } from "./modules/auth";
import { userRoutes } from "./modules/users";
import { uploadRoutes } from "./modules/upload";
import { cacheRoutes } from "./infrastructure/cache";
import { formRoutes } from "./modules/medical-forms/form.routes";

// Configuration
const PORT = Number(process.env.PORT || 3002);

// CORS Origins
const corsOrigins = [
  "http://localhost:3001",
  "https://lolambenhan.vercel.app",
  ...(process.env.CORS_ORIGINS?.split(",").map((s) => s.trim()) || []),
];

// ============================================
// DEPENDENCY INJECTION
// ============================================

// Infrastructure - External Services
const geminiProvider = new GeminiChatProvider();

// Interfaces - Repository Implementations
const commentRepo: ICommentRepository = new CommentRepositoryImpl();
const hoichanRepo: IHoichanRepository = new HoichanMessageRepositoryImpl();

// Interfaces - Controllers
const adminController = new AdminController();
const commentController = new CommentController(commentRepo);
const hoichanController = new HoichanController(hoichanRepo);
const chatController = new ChatController(geminiProvider);

// Services
const authService = getAuthService();

// ============================================
// CREATE ELYSIA APP
// ============================================

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

  // Global Error Handler
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
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return ResponseDto.error("INTERNAL_ERROR", errorMessage);
  })

  // Health Check
  .get("/", () =>
    ResponseDto.success({ message: "LoLamBenhAn API is running" }),
  )
  .get("/health", () => "ok");

// ============================================
// REGISTER ROUTES
// ============================================

// Admin Routes
adminController.registerRoutes(app);

// Chat Routes (AI)
chatController.registerRoutes(app);

// Comment Routes
commentController.registerRoutes(app, (token) =>
  adminController.verifyToken(token),
);

// Hoichan Routes
hoichanController.registerRoutes(
  app,
  (token) => adminController.verifyToken(token),
  async (token) => authService.verifyGoogleTokenWithAdmin(token),
);

// Auth Verify Route
app.post("/auth/verify", async ({ bearer }) => {
  if (!bearer) {
    throw new Error("Missing Google token");
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
    throw new Error(message);
  }
});

// Feature Module Routes
app.use(authRoutes);
app.use(userRoutes);
app.use(uploadRoutes);
app.use(cacheRoutes);
app.use(formRoutes);

// ============================================
// START SERVER
// ============================================

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
