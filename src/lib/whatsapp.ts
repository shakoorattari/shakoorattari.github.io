import { site } from '../data/site';

/** WhatsApp click-to-chat link; `text` pre-fills the message the visitor can edit before sending. */
export const whatsappUrl = (text?: string) =>
  `https://wa.me/${site.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
