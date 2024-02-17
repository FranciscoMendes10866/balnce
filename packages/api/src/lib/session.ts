import { sign, verify } from "jsonwebtoken";
import dayjs from "dayjs";

export const SESSION_SPAN = {
  BRIEF: "BRIEF",
  LONG: "LONG",
};

type ISessionSpan = keyof typeof SESSION_SPAN;

type JwtPayload = {
  id: number;
  timeframe?: ISessionSpan;
};

const SECRET = "secret";

const TOKEN_EXPIRATION = {
  FIFTEEN_MIN: 15 * 60,
  FOUR_MIN: 4 * 60,
};

type ITokenExpiration = keyof typeof TOKEN_EXPIRATION;

export const jwtArtisan = (
  payload: JwtPayload,
  expiration: ITokenExpiration = "FIFTEEN_MIN",
) => {
  if (!payload.timeframe) payload.timeframe = "LONG";
  return sign(payload, SECRET, { expiresIn: TOKEN_EXPIRATION[expiration] });
};

export const verifyJwt = (token: string) => verify(token, SECRET) as JwtPayload;

export const sessionArtisan = () => dayjs().add(7, "days").unix();

export const verifySession = (expiresAt: number) =>
  dayjs().isAfter(dayjs.unix(expiresAt));
