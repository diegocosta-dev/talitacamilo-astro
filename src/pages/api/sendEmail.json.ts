export const prerender = false;

import type { APIRoute } from "astro";
import { z } from "zod";

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

async function verifyRecaptcha(token: string, remoteip?: string) {
  const params = new URLSearchParams();
  params.set("secret", import.meta.env.RECAPTCHA_SECRET_KEY);
  params.set("response", token);
  if (remoteip) params.set("remoteip", remoteip);

  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) throw new Error("Failed to reach reCAPTCHA");

  return (await res.json()) as {
    success: boolean;
    score?: number;
    action?: string;
    hostname?: string;
    "error-codes"?: string[];
  };
}

async function sendWithResendREST(payload: {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
}) {
  const apiKey = import.meta.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

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
      data?.message ||
      data?.error ||
      data?.name ||
      raw ||
      `Resend API error (status ${res.status})`;
    throw new Error(
      typeof msg === "string" ? msg : JSON.stringify(msg, null, 2)
    );
  }

  return data;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const form = await request.formData();
    const raw = Object.fromEntries(form.entries());
    const input = schema.parse(raw);

    const result = await verifyRecaptcha(
      input.recaptchaToken as string,
      clientAddress
    );
    if (
      !result.success ||
      (typeof result.score === "number" && result.score < 0.5)
    ) {
      return json({ message: "reCAPTCHA validation failed." }, 400);
    }

    const fullName = `${input["first-name"]} ${input["last-name"]}`;
    const from = import.meta.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const to = import.meta.env.RESEND_TO_EMAIL || "diego@hellodative.com";

    await sendWithResendREST({
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
    const message =
      err?.message ||
      (typeof err === "string" ? err : "Unexpected error sending email");
    return json({ message }, 500);
  }
};
