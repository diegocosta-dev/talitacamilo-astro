// src/alpine-entry.ts
import type { Alpine } from "alpinejs";

// (se usar plugins como @alpinejs/focus, registre aqui também)
// import focus from '@alpinejs/focus'
import testimonials from "./js/testimonials"; // teu arquivo TS
import siteHeader from "./js/siteHeader";

export default (Alpine: Alpine) => {
  // Alpine.plugin(focus)
  Alpine.data("testimonials", testimonials);
  Alpine.data("siteHeader", siteHeader);
};
