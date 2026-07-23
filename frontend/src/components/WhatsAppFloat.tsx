import { MessageCircle } from "lucide-react";

export function WhatsAppFloat() {
  return (
    <a
      href=""
      target="_blank"
      rel="noreferrer"
      aria-label="Fale conosco no WhatsApp"
      className="fixed bottom-6 right-6 z-30 h-14 w-14 rounded-full bg-[#25D366] text-white shadow-lg shadow-black/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
