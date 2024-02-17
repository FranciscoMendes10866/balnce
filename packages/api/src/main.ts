import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { trpc } from "@elysiajs/trpc";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";

import { appRouter } from "./app";
import { createContext } from "./lib/trpc";

const app = new Elysia();

app.use(cors());
app.use(
  trpc(appRouter, {
    createContext,
    onError: ({ error }) => {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        // TODO: send to some (3rd party) error tracking service
      }
      return {
        ...error,
        status: getHTTPStatusCodeFromError(error),
      };
    },
  }),
);

app.listen(3333);
