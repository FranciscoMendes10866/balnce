import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { hash, verify } from "argon2";

import { router, publicProcedure } from "../lib/trpc";
import { sessionArtisan, jwtArtisan, verifySession } from "../lib/session";
import { users, sessions } from "../entities";

const signupSchema = z.object({
  firstName: z.string().min(3),
  lastName: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8).max(32),
});

const signinSchema = signupSchema.omit({ firstName: true, lastName: true });

const renewSessionSchema = z.object({
  sessionId: z.number().positive(),
});

const signoutSchema = renewSessionSchema.extend({
  clearAll: z.boolean().default(false),
});

export const identityRouter = router({
  signup: publicProcedure
    .input(signupSchema)
    .mutation(async ({ input, ctx }) => {
      const datum = ctx.db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .get();

      if (datum) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email already taken",
        });
      }

      const hashedPassword = await hash(input.password);

      const user = ctx.db
        .insert(users)
        .values({ ...input, password: hashedPassword })
        .returning()
        .get();

      const session = ctx.db
        .insert(sessions)
        .values({ expiresAt: sessionArtisan(), userId: user.id })
        .returning()
        .get();

      return {
        accessToken: jwtArtisan({ id: user.id }),
        sessionId: session.id,
      };
    }),
  signin: publicProcedure
    .input(signinSchema)
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;

      const user = ctx.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .get();
      if (!user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User does not exist",
        });
      }

      const isValid = await verify(user.password, password);
      if (!isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid credentials",
        });
      }

      const session = ctx.db
        .insert(sessions)
        .values({ expiresAt: sessionArtisan(), userId: user.id })
        .returning()
        .get();

      return {
        accessToken: jwtArtisan({ id: user.id }),
        sessionId: session.id,
      };
    }),
  renewSession: publicProcedure
    .input(renewSessionSchema)
    .mutation(({ input, ctx }) => {
      const session = ctx.db
        .select()
        .from(sessions)
        .where(eq(sessions.id, input.sessionId))
        .get();
      if (!session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid session",
        });
      }

      const isSessionExpired = verifySession(session.expiresAt);
      if (isSessionExpired) {
        ctx.db.delete(sessions).where(eq(sessions.id, input.sessionId)).run();
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invalid session",
        });
      }

      ctx.db.delete(sessions).where(eq(sessions.id, session.id)).run();
      const newSession = ctx.db
        .insert(sessions)
        .values({ expiresAt: sessionArtisan(), userId: session.userId })
        .returning()
        .get();

      return {
        accessToken: jwtArtisan({ id: newSession.userId }),
        sessionId: newSession.id,
      };
    }),
  signout: publicProcedure.input(signoutSchema).mutation(({ input, ctx }) => {
    const session = ctx.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, input.sessionId))
      .get();
    if (!session) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have permissions to perform the operation",
      });
    }

    const sql = input.clearAll
      ? eq(sessions.userId, session.userId)
      : eq(sessions.id, input.sessionId);
    ctx.db.delete(sessions).where(sql).run();

    return { success: true };
  }),
});
