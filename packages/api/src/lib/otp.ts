import { Hotp, generateConfig, generateSecret } from "time2fa";

type PasscodeDatum = {
  secret: string;
  code: string;
};

export const OTPArtisan = (): PasscodeDatum => {
  const secret = generateSecret();
  const config = generateConfig();
  const code = Hotp.generatePasscode({ secret, counter: 1 }, config);
  return { secret, code };
};

export const verifyOTP = ({ code, secret }: PasscodeDatum): boolean => {
  return Hotp.validate({
    passcode: code,
    secret,
    counter: 1,
  });
};
