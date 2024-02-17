import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { LRUCache } from "lru-cache";
import { verify } from "argon2";

import { router, publicProcedure } from "../lib/trpc";
import { jwtArtisan, verifyJwt, SESSION_SPAN } from "../lib/session";
import { OTPArtisan, verifyOTP } from "../lib/otp";
import { sendOTPEmail } from "../lib/mailing";
import { users } from "../entities";

const requestResetSchema = z.string().email();

const confirmResetSchema = z.object({
  shortAuthID: z.string().min(2),
  code: z.string().min(4),
  oldPassword: z.string().min(8).max(32),
  newPassword: z.string().min(8).max(32),
});

const cache = new LRUCache<number, string>({
  max: 50,
  ttl: 4 * 60 * 1000, // 4min
});

export const passwordRecoveryRouter = router({
  requestReset: publicProcedure
    .input(requestResetSchema)
    .mutation(async ({ input, ctx }) => {
      const user = ctx.db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users)
        .where(eq(users.email, input))
        .get();
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      const otp = OTPArtisan();
      cache.set(user.id, otp.secret);

      const emailHtml = ctx.templ("password-recovery", {
        fullName: [user.firstName, user.lastName].join(", "),
        passCode: otp.code,
      });
      if (!emailHtml) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const result = await sendOTPEmail({
        to: user.email,
        subject: "One Time Password (OTP) Request",
        body: emailHtml,
      });
      if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return {
        shortAuthID: jwtArtisan(
          { id: user.id, timeframe: "BRIEF" },
          "FOUR_MIN",
        ),
      };
    }),
  confirmReset: publicProcedure
    .input(confirmResetSchema)
    .mutation(async ({ input, ctx }) => {
      const values = verifyJwt(input.shortAuthID);
      if (values.timeframe !== SESSION_SPAN.BRIEF) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const datum = ctx.db
        .select({ password: users.password })
        .from(users)
        .where(eq(users.id, values.id))
        .get();
      if (!datum) throw new TRPCError({ code: "BAD_REQUEST" });

      const matches = await verify(datum.password, input.oldPassword);
      if (!matches) throw new TRPCError({ code: "BAD_REQUEST" });

      const otpSecret = cache.get(values.id);
      if (!otpSecret) throw new TRPCError({ code: "NOT_FOUND" });

      const isValid = verifyOTP({ secret: otpSecret, code: input.code });
      if (!isValid) throw new TRPCError({ code: "UNAUTHORIZED" });

      cache.delete(values.id);
      ctx.db
        .update(users)
        .set({ password: input.newPassword })
        .where(eq(users.id, values.id))
        .run();

      return { success: true };
    }),
});
