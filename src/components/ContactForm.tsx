import { useEffect, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

declare global {
  interface Window {
    grecaptcha?: any;
  }
}

const RECAPTCHA_SITE_KEY = import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY as string;

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (window.grecaptcha) return;

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const grecaptcha = await new Promise<any>((resolve, reject) => {
        let tries = 0;
        const iv = setInterval(() => {
          tries++;
          if (window.grecaptcha?.execute) {
            clearInterval(iv);
            resolve(window.grecaptcha);
          }
          if (tries > 50) {
            clearInterval(iv);
            reject(new Error("reCAPTCHA not loaded"));
          }
        }, 100);
      });

      const recaptchaToken = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: "contact_form" });
      formData.set("recaptchaToken", recaptchaToken);

      const res = await fetch("/api/sendEmail.json", {
        method: "POST",
        body: formData,
      });

      const contentType = res.headers.get("content-type") ?? "";
      const raw = await res.text();

      let data: any = null;
      if (contentType.includes("application/json")) {
        try {
          data = JSON.parse(raw);
        } catch {
        }
      }

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data?.message || raw || "Failed to send. Please try again.");
        return;
      }

      setStatus("success");
      form.reset();
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.message || "Network error. Please try again.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {status === "error" && (
        <div role="status" aria-live="polite" className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          <p role="alert" className="text-red-600">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 bg-primary/5 p-6">
        <fieldset className="flex flex-col gap-6 md:flex-row">
          <label className="w-full text-lg">
            <span className="mb-2 block">
              First Name <span className="text-red-500">*</span>
            </span>
            <input type="text" name="first-name" required className="focus:ring-primary/20 py-3 px-4 focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md" />
          </label>

          <label className="w-full text-lg">
            <span className="mb-2 block">
              Last Name <span className="text-red-500">*</span>
            </span>
            <input type="text" name="last-name" required className="focus:ring-primary/20 py-3 px-4 focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md" />
          </label>
        </fieldset>

        <fieldset className="flex flex-col gap-6 md:flex-row">
          <label className="w-full text-lg">
            <span className="mb-2 block">
              Email <span className="text-red-500">*</span>
            </span>
            <input type="email" name="email" required className="focus:ring-primary/20 py-3 px-4 focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md" />
          </label>

          <label className="w-full text-lg">
            <span className="mb-2 block">
              Phone <span className="text-red-500">*</span>
            </span>
            <input type="tel" name="phone" required className="focus:ring-primary/20 py-3 px-4 focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md" />
          </label>
        </fieldset>

        <fieldset>
          <label className="w-full text-lg">
            <span className="mb-2 block">
              Message <span className="text-red-500">*</span>
            </span>
            <textarea name="message" required className="focus:ring-primary/20 py-3 px-4 focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md" rows={6} />
          </label>
        </fieldset>

        <div>
          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex items-center px-4 py-2 border transition-colors border-transparent text-sm font-medium cursor-pointer shadow-sm text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary mx-2 order-10"
          >
            {status === "loading" ? "Sending..." : "Contact Us"}
          </button>
        </div>
      </form>
    </div>
  );
}
