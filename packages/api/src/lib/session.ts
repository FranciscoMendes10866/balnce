import { sign, verify } from "jsonwebtoken";
import dayjs from "dayjs";

const SECRET = process.env.JWT_SECRET || "secret";

export const SESSION_SPAN = {
  BRIEF: "BRIEF",
  LONG: "LONG",
};

type ISessionSpan = keyof typeof SESSION_SPAN;

type JwtPayload = {
  id: number;
  timeframe?: ISessionSpan;
};

const TOKEN_EXPIRATION: Record<ISessionSpan, number> = {
  LONG: 15 * 60,
  BRIEF: 4 * 60,
};

export const jwtArtisan = (payload: JwtPayload) => {
  if (!payload.timeframe) payload.timeframe = "LONG";
  const expiresIn = TOKEN_EXPIRATION[payload.timeframe];
  return sign(payload, SECRET, { expiresIn });
};

export const verifyJwt = (token: string) => verify(token, SECRET) as JwtPayload;

export const sessionArtisan = () => dayjs().add(7, "days").unix();

export const verifySession = (expiresAt: number) =>
  dayjs().isAfter(dayjs.unix(expiresAt));
