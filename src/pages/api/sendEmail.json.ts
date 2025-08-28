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
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();

    // transforma FormData em objeto simples
    const raw = Object.fromEntries(form.entries());
    const input = schema.parse(raw);

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
      return new Response(
        JSON.stringify({ message: `Message failed to send: ${send.error}` }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ message: "Message successfully sent!" }),
      { status: 200 }
    );
  } catch (err: any) {
    // zod errors
    if (err?.issues) {
      const first = err.issues[0];
      return new Response(
        JSON.stringify({ message: first?.message ?? "Invalid input" }),
        { status: 400 }
      );
    }
    return new Response(
      JSON.stringify({ message: err?.message ?? "Unexpected error" }),
      { status: 500 }
    );
  }
};
