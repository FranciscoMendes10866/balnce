import { router } from "./lib/trpc";
import { identityRouter, userRouter, passwordRecoveryRouter } from "./domains";

export const appRouter = router({
  identity: identityRouter,
  user: userRouter,
  passwordRecovery: passwordRecoveryRouter,
});

export type Router = typeof appRouter;
