import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCart, formatBRL } from "@/lib/cart";
import {
  availableProductQuantityLabel,
  isProductAvailable,
  type Product,
} from "@/lib/products";
import { getProductFromBackend, getProductsFromBackend } from "@/lib/api";
import { productSlug, productUrl, SITE_URL } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Truck } from "lucide-react";
import { useEffect } from "react";
import { trackFunnel } from "@/lib/funnel";

function mapProduct(value: any): Product {
  return {
    id: String(value.id),
    name: value.name,
    description: value.description || "",
    category: value.category || "prata",
    price: Number(value.price || 0),
    discountPercent: Number(value.discountPercent || 0),
    discountPrice: value.discountPrice ? Number(value.discountPrice) : undefined,
    image: value.image || value.imageUrl || "",
    stockQuantity: Number(value.stockQuantity ?? 0),
    reservedQuantity: Number(value.reservedQuantity ?? 0),
    weight: value.weight == null ? undefined : Number(value.weight),
    height: value.height == null ? undefined : Number(value.height),
    width: value.width == null ? undefined : Number(value.width),
    length: value.length == null ? undefined : Number(value.length),
    inStock: Number(value.stockQuantity ?? 0) - Number(value.reservedQuantity ?? 0) > 0 && value.inStock !== false,
  };
}

export const Route = createFileRoute("/produtos_/$slug")({
  loader: async ({ params }) => {
    const separator = params.slug.lastIndexOf("--");
    const productId = separator >= 0 ? params.slug.slice(separator + 2) : "";
    const remoteProduct = productId ? await getProductFromBackend(productId) : null;
    if (remoteProduct) return mapProduct(remoteProduct);

    const remote = await getProductsFromBackend();
    if (!Array.isArray(remote)) {
      throw new Error("Não foi possível consultar o produto.");
    }
    const products = remote.map(mapProduct);
    const product = products.find((item) =>
      String(item.id) === productId || productSlug(item) === params.slug
    );
    if (!product) throw notFound();
    return product;
  },
  head: ({ loaderData: product }) => {
    if (!product) return {};
    const url = productUrl(product);
    const price = product.discountPrice ?? product.price;
    return {
      meta: [
        { title: `${product.name} — Angell` },
        { name: "description", content: product.description },
        { property: "og:type", content: "product" },
        { property: "og:title", content: product.name },
        { property: "og:description", content: product.description },
        { property: "og:image", content: product.image },
        { property: "og:url", content: url },
        { property: "product:price:amount", content: price.toFixed(2) },
        { property: "product:price:currency", content: "BRL" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const product = Route.useLoaderData();
  const { add } = useCart();
  const price = product.discountPrice ?? product.price;
  const available = isProductAvailable(product);
  useEffect(() => trackFunnel("PRODUCT_VIEWED", product.category), [product.category]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [product.image],
    sku: product.id,
    category: product.category,
    offers: {
      "@type": "Offer",
      url: productUrl(product),
      priceCurrency: "BRL",
      price: price.toFixed(2),
      availability: `https://schema.org/${available ? "InStock" : "OutOfStock"}`,
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Angell" },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "BR" },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "BR",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
      },
    },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Produtos", item: `${SITE_URL}/produtos` },
      { "@type": "ListItem", position: 3, name: product.name, item: productUrl(product) },
    ],
  };

  return (
    <article className="mx-auto max-w-6xl px-5 sm:px-8 py-10 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <nav aria-label="Navegação estrutural" className="text-sm text-muted-foreground mb-8">
        <Link to="/">Início</Link> / <Link to="/produtos">Produtos</Link> / <span>{product.name}</span>
      </nav>
      <div className="grid md:grid-cols-2 gap-10 md:gap-16">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full aspect-square object-cover rounded-2xl bg-secondary" />
        ) : (
          <div className="flex aspect-square items-center justify-center rounded-2xl bg-secondary text-sm text-muted-foreground">Imagem indisponível</div>
        )}
        <div>
          <p className="uppercase tracking-widest text-xs text-muted-foreground capitalize">{product.category}</p>
          <h1 className="font-display text-4xl sm:text-5xl mt-3">{product.name}</h1>
          <p className="text-2xl font-semibold mt-6">{formatBRL(price)}</p>
          {product.discountPrice && <p className="text-sm text-muted-foreground line-through">{formatBRL(product.price)}</p>}
          <p className="mt-6 leading-relaxed text-muted-foreground">{product.description}</p>
          <p className={`mt-6 text-sm font-medium ${available ? "text-emerald-600" : "text-destructive"}`}>
            {available ? availableProductQuantityLabel(product) : "Produto indisponível"}
          </p>
          <Button disabled={!available} onClick={() => add(product)} className="w-full h-12 rounded-full mt-6 uppercase tracking-widest text-xs">Adicionar à sacola</Button>
          <div className="mt-8 space-y-3 text-sm text-muted-foreground">
            <p className="flex gap-2"><Truck className="h-4 w-4"/> Frete e prazo calculados pelo CEP na sacola.</p>
            <p className="flex gap-2"><ShieldCheck className="h-4 w-4"/> Consulte a <Link to="/trocas" className="underline">política de troca e devolução</Link>.</p>
          </div>
        </div>
      </div>
    </article>
  );
}
