export const prerender = false;

import type { APIRoute } from "astro";
import { z, ZodError } from "zod";

const schema = z.object({
  "first-name": z.string().min(1, "First name is required"),
  "last-name": z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(6, "Enter a valid phone"),
  message: z.string().min(1, "Message is required"),
  recaptchaToken: z.string().min(1, "reCAPTCHA is required"),
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function getEnv(context: Parameters<APIRoute>[0]) {
  const env =
    // @ts-ignore
    context.locals?.runtime?.env ??
    // @ts-ignore
    context.locals?.env ??
    // @ts-ignore
    context.platform?.env ??
    {};
  return env as Record<string, string>;
}

async function verifyRecaptcha(
  secret: string,
  token: string,
  remoteip?: string
) {
  const params = new URLSearchParams();
  params.set("secret", secret);
  params.set("response", token);
  if (remoteip) params.set("remoteip", remoteip);

  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const raw = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(raw);
  } catch {
    data = { raw };
  }

  if (!res.ok) throw new Error("Failed to reach reCAPTCHA");
  return data as {
    success: boolean;
    score?: number;
    action?: string;
    hostname?: string;
    "error-codes"?: string[];
  };
}

async function sendWithResend(
  apiKey: string,
  payload: {
    from: string;
    to: string | string[];
    subject: string;
    html: string;
  }
) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(raw);
  } catch {
    data = { raw };
  }

  if (!res.ok) {
    const msg =
      data?.message || data?.error || raw || `Resend error ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

export const POST: APIRoute = async (context) => {
  try {
    const env = getEnv(context);
    const { request, clientAddress } = context;

    const form = await request.formData();
    const raw = Object.fromEntries(form.entries());
    const input = schema.parse(raw);

    const recaptchaSecret =
      env.RECAPTCHA_SECRET_KEY ||
      (import.meta as any).env?.RECAPTCHA_SECRET_KEY;
    if (!recaptchaSecret) throw new Error("Missing RECAPTCHA_SECRET_KEY");

    const recaptcha = await verifyRecaptcha(
      recaptchaSecret,
      input.recaptchaToken as string,
      clientAddress
    );
    if (
      !recaptcha.success ||
      (typeof recaptcha.score === "number" && recaptcha.score < 0.5)
    ) {
      return json({ message: "reCAPTCHA validation failed." }, 400);
    }

    const resendKey =
      env.RESEND_API_KEY || (import.meta as any).env?.RESEND_API_KEY;
    if (!resendKey) throw new Error("Missing RESEND_API_KEY");

    const fullName = `${input["first-name"]} ${input["last-name"]}`;
    const from =
      env.RESEND_FROM_EMAIL ||
      (import.meta as any).env?.RESEND_FROM_EMAIL ||
      "onboarding@resend.dev";
    const to =
      env.RESEND_TO_EMAIL ||
      (import.meta as any).env?.RESEND_TO_EMAIL ||
      "diego@hellodative.com";

    await sendWithResend(resendKey, {
      from,
      to,
      subject: `New Contact Form Submission from ${fullName}`,
      html: `
        <h2>New message from contact form</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${input.email}</p>
        <p><strong>Phone:</strong> ${input.phone}</p>
        <p><strong>Message:</strong> ${input.message}</p>
      `,
    });

    return json({ message: "Message successfully sent!" }, 200);
  } catch (err: any) {
    if (err instanceof ZodError) {
      const errors: Record<string, string> = {};
      for (const issue of err.issues) {
        const path = issue.path?.[0];
        if (typeof path === "string" && !errors[path]) {
          errors[path] = issue.message;
        }
      }
      return json({ message: "Validation failed", errors }, 422);
    }

    return json({ message: err?.message || "Unexpected error" }, 500);
  }
};
