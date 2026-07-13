import { MessageCircle } from "lucide-react";

export function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/5511999999999?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20a%20Angel"
      target="_blank"
      rel="noreferrer"
      aria-label="Fale conosco no WhatsApp"
      className="fixed bottom-6 right-6 z-30 h-14 w-14 rounded-full bg-[#25D366] text-white shadow-lg shadow-black/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
