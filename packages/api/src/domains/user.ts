import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { router } from "../lib/trpc";
import { protectedProcedure } from "../lib/middleware";
import { users } from "../entities";

export const userRouter = router({
  currentUser: protectedProcedure.query(({ ctx }) => {
    const user = ctx.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.id, ctx.userId))
      .get();
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });

    return user;
  }),
});
