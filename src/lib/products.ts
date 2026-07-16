import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import p6 from "@/assets/p6.jpg";
import p7 from "@/assets/p7.jpg";
import p8 from "@/assets/p8.jpg";

export type Category = "prata" | "cosmeticos";

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  image: string;
  description: string;
}

export const products: Product[] = [
  { id: "1", name: "Colar Éclat Prata 925", price: 189, category: "prata", image: p1, description: "Colar minimalista em prata 925 com pingente delicado." },
  { id: "2", name: "Argolas Lumière", price: 149, category: "prata", image: p2, description: "Argolas leves em prata polida, essenciais para o dia a dia." },
  { id: "3", name: "Anel Solitaire Cristal", price: 229, category: "prata", image: p3, description: "Anel em prata com cristal transparente lapidado." },
  { id: "4", name: "Sérum Radiance Angel", price: 179, category: "cosmeticos", image: p4, description: "Sérum facial iluminador com vitamina C e ácido hialurônico." },
  { id: "5", name: "Batom Rosé Velvet", price: 89, category: "cosmeticos", image: p5, description: "Batom matte de longa duração em tom rosé natural." },
  { id: "6", name: "Creme Reparador Nuit", price: 219, category: "cosmeticos", image: p6, description: "Creme facial noturno com peptídeos e ceramidas." },
  { id: "7", name: "Pulseira Whisper 925", price: 159, category: "prata", image: p7, description: "Pulseira delicada em prata com fecho ajustável." },
  { id: "8", name: "Eau de Parfum Aurore", price: 279, category: "cosmeticos", image: p8, description: "Perfume floral amadeirado com notas de baunilha." },
];