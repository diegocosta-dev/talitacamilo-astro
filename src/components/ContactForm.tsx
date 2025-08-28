import { useState } from "react";
import type { FormEvent } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/contact", { method: "POST", body: formData });

      // tenta JSON; se não der, cai em texto
      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
        const text = await res.text();
        payload = { message: text || "Unexpected response" };
      }

      if (!res.ok) {
        setStatus("error");
        setMessage(payload?.message || "An error occurred. Please try again.");
        return;
      }

      setStatus("success");
      setMessage(payload?.message || "Success!");
      form.reset();
    } catch (err) {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6 bg-primary/5 p-6">
      <fieldset className="flex flex-col gap-6 md:flex-row">
        <label htmlFor="first-name" className="text-lg w-full">
          <span className="pb-2 block">
            First Name <span className="text-primary">*</span>
          </span>
          <input
            className="focus:ring-primary/20 py-3 px-4 focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
            type="text"
            id="first-name"
            name="first-name"
            autoComplete="first-name"
            required
          />
        </label>

        <label htmlFor="last-name" className="text-lg w-full">
          <span className="pb-2 block">
            Last Name <span className="text-primary">*</span>
          </span>
          <input
            className="focus:ring-primary/20 py-3 px-4 focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
            type="text"
            id="last-name"
            name="last-name"
            autoComplete="last-name"
            required
          />
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-6 md:flex-row">
        <label htmlFor="email" className="text-lg w-full">
          <span className="pb-2 block">
            Email <span className="text-primary">*</span>
          </span>
          <input
            className="focus:ring-primary/20 py-3 px-4 focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            required
          />
        </label>

        <label htmlFor="phone" className="text-lg w-full">
          <span className="pb-2 block">
            Phone <span className="text-primary">*</span>
          </span>
          <input
            className="focus:ring-primary/20 py-3 px-4 focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
            type="tel"
            id="phone"
            name="phone"
            autoComplete="phone"
            required
          />
        </label>
      </fieldset>

      <label htmlFor="message" className="block">
        <span className="pb-2 block">
          Message <span className="text-primary">*</span>
        </span>

        <textarea
          className="focus:ring-primary/20 py-3 px-4 focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
          id="message"
          name="message"
          rows={5}
          required
        />
      </label>

      {/* Honeypot simples anti-spam (escondido visualmente) */}
      <div className="sr-only" aria-hidden="true">
        <input type="text" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <button
          className="inline-flex items-center px-4 py-2 border transition-colors border-transparent text-md font-medium cursor-pointer shadow-sm text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary mx-2 order-10"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Sending..." : "Contact Us"}
        </button>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={
          status === "success"
            ? "text-green-600 mt-2"
            : status === "error"
              ? "text-red-600 mt-2"
              : "sr-only"
        }
      >
        {message}
      </p>
    </form>
  );
}
