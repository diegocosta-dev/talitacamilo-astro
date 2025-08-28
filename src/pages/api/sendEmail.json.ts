// pages/api/sendEmail.json.ts
export const prerender = false;
import type { APIRoute } from "astro";
import { z } from "zod";
import { Resend } from "resend";

const resend = new Resend(import.meta.env.PUBLIC_RESEND_API_KEY);

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
  const secret = import.meta.env.RECAPTCHA_SECRET_KEY;
  if (!secret) throw new Error("Missing RECAPTCHA_SECRET_KEY");

  const params = new URLSearchParams();
  params.set("secret", secret);
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

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const form = await request.formData();
    const raw = Object.fromEntries(form.entries());
    const input = schema.parse(raw);

    // 1) valida reCAPTCHA
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
    // (Opcional) reforçar:
    // if (result.action !== "contact_form") return json({ message: "Invalid reCAPTCHA action" }, 400);
    // if (result.hostname !== "seu-dominio.com") return json({ message: "Invalid hostname" }, 400);

    // 2) enviar e-mail
    const fullName = `${input["first-name"]} ${input["last-name"]}`;

    const send = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "diego@hellodative.com",
      subject: `New Contact Form Submission from ${fullName}`,
      html: `
        <h2>New message from contact form</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${input.email}</p>
        <p><strong>Phone:</strong> ${input.phone}</p>
        <p><strong>Message:</strong> ${input.message}</p>
      `,
    });

    if (!send.data) {
      return json({ message: `Message failed to send: ${send.error}` }, 500);
    }

    return json({ message: "Message successfully sent!" }, 200);
  } catch (err: any) {
    if (err?.issues) {
      const first = err.issues[0];
      return json({ message: first?.message ?? "Invalid input" }, 400);
    }
    return json({ message: err?.message ?? "Unexpected error" }, 500);
  }
};
