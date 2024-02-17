import { Eta } from "eta";

type ICompiledTemplates = Record<string, (datum?: object) => string>;

export const templClosure = () => {
  const engine = new Eta();

  const compiledTemplates = {} as ICompiledTemplates;
  for (const [target, content] of Object.entries(templates)) {
    compiledTemplates[target] = engine.compile(content);
  }

  const render = <Target extends EmailTemplates["target"]>(
    ...args: Extract<EmailTemplates, { target: Target }> extends {
      datums: infer Datum extends object;
    }
      ? [Target, Datum]
      : [Target]
  ) => {
    const [target, datum] = args;
    if (!datum) return; // silent error

    const compiledTemplate = compiledTemplates?.[target];
    if (!compiledTemplate) return; // silent error

    return compiledTemplate(datum);
  };

  return render;
};

type EmailTemplates = {
  target: "password-recovery";
  datums: { fullName: string; passCode: string };
};

const templates: Record<EmailTemplates["target"], string> = {
  "password-recovery": `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>One Time Password (OTP) Email</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f7f7f7;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          padding: 20px;
          background-color: #fff;
          border-radius: 5px;
        }
        h1 {
          text-align: center;
        }
        .otp-code {
          font-size: 24px;
          text-align: center;
          margin-top: 20px;
          margin-bottom: 30px;
        }
        .instructions {
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>One Time Password (OTP) Email</h1>
        <p>Dear <%= it.fullName %>,</p>
        <p>Your One Time Password (OTP) is:</p>
        <p class="otp-code"><%= it.passCode %></p>
        <p class="instructions">Please use this OTP to proceed with your action.</p>
        <p>If you did not request this OTP, please ignore this email.</p>
        <p>Best regards,<br>BALNCE</p>
      </div>
    </body>
    </html>
  `,
};
