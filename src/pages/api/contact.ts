// src/pages/api/contact.ts
import type { APIRoute } from "astro";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const data = await request.formData();

  const honey = String(data.get("company") ?? "");
  if (honey) return json({ message: "Success!" });

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
  if (message.length > 5000) {
    return json({ message: "Message too long" }, 400);
  }

  const name = `${firstName} ${lastName}`.trim();

  const payload = {
    personalizations: [
      { to: [{ email: "diego@hellodative.com", name: "Info" }] },
    ],
    from: {
      email: "diego@hellodative.com",
      name: "Talita Camilo Professional Services",
    },
    subject: `New contact message from ${name}`,
    content: [
      {
        type: "text/plain",
        value:
          `Name: ${name}\n` +
          `Email: ${email}\n` +
          `Phone: ${phone}\n\n` +
          `Message:\n${message}\n`,
      },
    ],
  };

  try {
    const res = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("MailChannels error:", errText);
      return json(
        {
          message:
            "An error occurred while sending the message. Please try again.",
        },
        500
      );
    }

    return json({ message: "Success!" }, 200);
  } catch (e: any) {
    console.error("Server error:", e);
    return json({ message: "Internal server error." }, 500);
  }
};
