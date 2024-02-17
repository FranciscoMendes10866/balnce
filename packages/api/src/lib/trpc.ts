import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";

import { templClosure } from "./templ";
import { db } from "./db";

const templ = templClosure();

export const createContext = async ({ req }: FetchCreateContextFnOptions) => ({
  req,
  db,
  templ,
});

type IContext = Awaited<ReturnType<typeof createContext>>;
const t = initTRPC.context<IContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
