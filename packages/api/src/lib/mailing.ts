import { Resend } from "resend";

const client = new Resend("API_KEY");

type IBaseSendEmail = {
  to: string;
  subject: string;
  body: string;
};

type ISendOTPEmail = {
  to: string;
} & IBaseSendEmail;

type IMaybeErrorMessage = string | undefined;

export const sendOTPEmail = async ({
  to,
  subject,
  body,
}: ISendOTPEmail): Promise<IMaybeErrorMessage> => {
  const { error } = await client.emails.send({
    to,
    subject,
    from: "BALNCE",
    html: body,
  });
  return error?.message;
};
