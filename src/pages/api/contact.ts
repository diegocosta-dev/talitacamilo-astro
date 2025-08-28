// src/pages/api/contact.ts
import type { APIRoute } from "astro";
import { Resend } from "resend";
import { RESEND_API_KEY } from "astro:env/server";

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

export const POST: APIRoute = async ({ request }) => {
  const data = await request.formData();

  // Honeypot
  if (String(data.get("company") ?? "")) return json({ message: "Success!" });

  const firstName = String(data.get("first-name") ?? "").trim();
  const lastName = String(data.get("last-name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim();
  const phone = String(data.get("phone") ?? "").trim();
  const message = String(data.get("message") ?? "").trim();

  if (!firstName || !lastName || !email || !phone || !message) {
    return json({ message: "Missing required fields" }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ message: "Invalid email" }, 400);
  }

  const name = `${firstName} ${lastName}`.trim();

  if (!RESEND_API_KEY) {
    console.error("Missing RESEND_API_KEY");
    return json({ message: "Email service not configured." }, 500);
  }

  try {
    const resend = new Resend(RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: "Website <website@talitacamilo.com>",
      to: ["info@talitacamilo.com"],
      replyTo: email,
      subject: `New contact message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}\n`,
    });

    if (error) {
      console.error("Resend error:", error);
      return json({ message: "Failed to send email." }, 500);
    }

    return json({ message: "Success!" }, 200);
  } catch (e: any) {
    console.error("Server error:", e?.stack || e?.message || String(e));
    return json({ message: "Internal server error." }, 500);
  }
};
