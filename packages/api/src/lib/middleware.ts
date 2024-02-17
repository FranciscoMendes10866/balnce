import { TRPCError } from "@trpc/server";

import { publicProcedure } from "./trpc";
import { verifyJwt, SESSION_SPAN } from "./session";

export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const authorization = ctx.req.headers.get("authorization");
  const accessToken = authorization?.replace("Bearer ", "");
  if (!accessToken) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const payload = verifyJwt(accessToken);
  if (!payload.id || payload.timeframe === SESSION_SPAN.BRIEF) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      userId: payload.id,
    },
  });
});
