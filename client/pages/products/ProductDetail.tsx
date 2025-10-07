import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  BatteryCharging,
  CheckCircle2,
  Gauge,
  Info,
  Share2,
  ShieldCheck,
  Sparkles,
  Sun,
  Tag,
  Truck,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/state/cart";
import type { Product } from "@/components/ProductCard";
import {
  FALLBACK_PRODUCT_IMAGE,
  mapSupabaseProduct,
  normaliseStringArray,
  readLocalProducts,
} from "@/lib/products";
import { calculateOfferPricing, type OfferDetail } from "@/lib/offers";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type ProductDetailData = Product & {
  description?: string | null;
  brand?: string | null;
  wattage?: number | null;
  panel_type?: string | null;
  warranty?: string | null;
  delivery_time?: string | null;
  sku?: string | null;
  availability?: string | null;
  offers: OfferDetail[];
  highlights: string[];
};

type FAQItem = { question: string; answer: string };

type OfferRecord = any;

const DEFAULT_OFFERS: OfferDetail[] = [
  {
    id: "emi-12",
    title: "No-cost EMI for 12 months",
    description: "Effective monthly EMI from ₹8,999 with partner banks.",
    couponCode: "EMI12",
    discountType: "percentage",
    discountValue: 5,
    terms: "Valid on credit cards from ICICI, HDFC, Axis and SBI.",
    badge: "Popular",
  },
  {
    id: "bank-5000",
    title: "Flat ₹5,000 instant bank discount",
    description: "Applicable on prepaid transactions using select bank cards.",
    couponCode: "SOLAR5000",
    discountType: "flat",
    discountValue: 5000,
    terms: "Min cart value ₹75,000.",
  },
  {
    id: "survey-bundle",
    title: "Free site survey & installation support",
    description:
      "Complimentary site survey worth ₹4,999 with every module bundle.",
    discountType: "flat",
    discountValue: 0,
    terms: "Survey will be scheduled within 48 hours of purchase.",
    badge: "Included",
  },
];

const DEFAULT_HIGHLIGHTS = [
  "High efficiency mono PERC cells with excellent low-light performance",
  "Weather-sealed junction box with IP68 rating",
  "Robust anodized aluminium frame engineered for Indian conditions",
  "Compatible with on-grid and hybrid inverter setups",
];

const FAQ_ENTRIES: FAQItem[] = [
  {
    question: "Do I get on-site installation support?",
    answer:
      "Yes, certified engineers will visit your location for survey, mounting structure planning, and installation guidance.",
  },
  {
    question: "What kind of warranty is included?",
    answer:
      "You receive a 25-year performance warranty and a 12-year product warranty covering manufacturing defects.",
  },
  {
    question: "Can I claim government subsidies?",
    answer:
      "Residential rooftop installations under 3 kW are eligible for central subsidies under the PM-Surya Ghar Yojana.",
  },
];

type DiscountType = "percentage" | "flat";

function inr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function toDetailProduct(base: Product): ProductDetailData {
  return {
    ...base,
    description: null,
    brand: null,
    wattage: null,
    panel_type: null,
    warranty: null,
    delivery_time: null,
    sku: null,
    availability: null,
    offers: DEFAULT_OFFERS,
    highlights: DEFAULT_HIGHLIGHTS,
  };
}

function parseDiscountType(value: unknown): DiscountType {
  if (typeof value !== "string") return "flat";
  const lowered = value.toLowerCase();
  if (["percentage", "percent", "pct"].includes(lowered)) return "percentage";
  return "flat";
}

function normaliseOffer(
  record: OfferRecord,
  index: number,
): OfferDetail | null {
  if (!record) return null;
  if (typeof record === "string") {
    return {
      id: `text-${index}`,
      title: record,
      description: record,
      discountType: "flat",
      discountValue: 0,
    };
  }
  const source = record.offer ?? record.offers ?? record;
  if (!source) return null;
  const id = String(source.id ?? record.id ?? `offer-${index}`);
  const title = source.title ?? source.name ?? source.heading;
  if (!title) return null;
  const discountValueRaw =
    source.discount_value ?? source.discountValue ?? source.value ?? 0;
  return {
    id,
    title,
    description: source.description ?? source.details ?? null,
    couponCode: source.coupon_code ?? source.couponCode ?? null,
    terms: source.terms ?? source.conditions ?? null,
    badge: source.badge ?? null,
    discountType: parseDiscountType(source.discount_type ?? source.type),
    discountValue: Number.isFinite(Number(discountValueRaw))
      ? Number(discountValueRaw)
      : 0,
  };
}

function dedupeOffers(offers: OfferDetail[]): OfferDetail[] {
  const map = new Map<string, OfferDetail>();
  offers.forEach((offer, index) => {
    const key = offer.id || `offer-${index}`;
    map.set(key, { ...offer, id: key });
  });
  return Array.from(map.values());
}

function ensureGallery(images: unknown, fallback: string): string[] {
  if (Array.isArray(images)) {
    const filtered = images
      .map((img) => (typeof img === "string" ? img : null))
      .filter((img): img is string => Boolean(img));
    if (filtered.length) return filtered;
  }
  if (typeof images === "string" && images.trim().length > 0) {
    return [images];
  }
  return [fallback];
}

function buildSpecs(product: ProductDetailData | null) {
  if (!product) return [] as { label: string; value: string }[];
  return [
    { label: "Brand", value: product.brand || "Waaree" },
    {
      label: "Module wattage",
      value: product.wattage ? `${product.wattage} W` : "540 W (typical)",
    },
    {
      label: "Panel type",
      value: product.panel_type || "Mono PERC Half-Cut",
    },
    {
      label: "Availability",
      value: product.availability || "In stock",
    },
  ];
}

function FeatureHighlights() {
  const cards = [
    {
      icon: Sun,
      title: "High solar yield",
      description: "Cell efficiency above 21% with optimized glass texturing.",
    },
    {
      icon: Zap,
      title: "Robust build",
      description: "Anodized aluminium frame tested for 5400 Pa snow load.",
    },
    {
      icon: BatteryCharging,
      title: "Hybrid ready",
      description: "Compatible with on-grid, off-grid and hybrid inverters.",
    },
    {
      icon: Gauge,
      title: "Fast installation",
      description: "Pre-drilled frame with MC4 connectors for quick setup.",
    },
  ];

  return (
    <section className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-xl border border-border bg-muted/40 p-6"
        >
          <card.icon className="h-8 w-8 text-primary" />
          <h3 className="mt-4 text-base font-semibold text-foreground">
            {card.title}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {card.description}
          </p>
        </div>
      ))}
    </section>
  );
}

function InfoTabs({
  descriptionText,
  highlights,
  specs,
  warrantyText,
  deliveryText,
}: {
  descriptionText: string;
  highlights: string[];
  specs: { label: string; value: string }[];
  warrantyText: string;
  deliveryText: string;
}) {
  return (
    <section className="mt-12">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="technical">Technical specs</TabsTrigger>
          <TabsTrigger value="installation">
            Installation & Warranty
          </TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>
        <TabsContent
          value="overview"
          className="rounded-xl border border-border bg-background p-6"
        >
          <p className="text-sm leading-relaxed text-muted-foreground">
            {descriptionText}
          </p>
          <ul className="mt-4 grid gap-3 text-sm text-foreground sm:grid-cols-2">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent
          value="technical"
          className="rounded-xl border border-border bg-background p-6"
        >
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            {specs.map((row) => (
              <div key={row.label}>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {row.label}
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  {row.value}
                </dd>
              </div>
            ))}
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Junction box
              </dt>
              <dd className="mt-1 font-medium text-foreground">
                IP68, factory fitted MC4 compatible connectors
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Frame
              </dt>
              <dd className="mt-1 font-medium text-foreground">
                Anodized aluminium, 40 mm profile
              </dd>
            </div>
          </dl>
        </TabsContent>
        <TabsContent
          value="installation"
          className="rounded-xl border border-border bg-background p-6"
        >
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>{warrantyText}</p>
            <p>{deliveryText}</p>
            <p>
              Our installation partners will assist with mounting structure
              selection, alignment, earthing and wiring to your inverter.
            </p>
            <p>
              Support is available in over 120 cities with 48-hour on-site
              response for metro regions.
            </p>
          </div>
        </TabsContent>
        <TabsContent
          value="faq"
          className="rounded-xl border border-border bg-background p-6"
        >
          <div className="space-y-4">
            {FAQ_ENTRIES.map((item) => (
              <article key={item.question}>
                <h3 className="text-sm font-semibold text-foreground">
                  {item.question}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}

function OfferList({
  offers,
  selectedOfferId,
  onSelect,
  basePrice,
}: {
  offers: OfferDetail[];
  selectedOfferId: string | null;
  onSelect: (offerId: string | null) => void;
  basePrice: number;
}) {
  if (!offers.length) return null;
  return (
    <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center justify-between text-sm">
        <h2 className="font-semibold uppercase tracking-wide text-primary">
          Offers & deals
        </h2>
        <span className="text-muted-foreground">Choose an offer</span>
      </div>
      <div className="mt-4 grid gap-3">
        {offers.map((offer, index) => {
          const { finalPrice, discountAmount } = calculateOfferPricing(
            basePrice,
            offer,
          );
          const isSelected = offer.id === selectedOfferId;
          return (
            <div
              key={offer.id || index}
              className={cn(
                "rounded-lg border bg-background p-3 transition-shadow",
                isSelected
                  ? "border-primary shadow-sm"
                  : "border-border hover:border-primary/60",
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">
                      {offer.title}
                    </span>
                    {offer.badge && (
                      <Badge variant="secondary" className="rounded-full">
                        {offer.badge}
                      </Badge>
                    )}
                  </div>
                  {offer.description && (
                    <p className="text-xs text-muted-foreground">
                      {offer.description}
                    </p>
                  )}
                  <p className="text-xs font-medium text-primary">
                    Save {inr(discountAmount)} • Pay {inr(finalPrice)}
                  </p>
                  {offer.couponCode && (
                    <p className="text-xs font-semibold text-muted-foreground">
                      Use code {offer.couponCode}
                    </p>
                  )}
                  {offer.terms && (
                    <p className="text-xs text-muted-foreground">
                      {offer.terms}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  {isSelected ? (
                    <Badge
                      variant="outline"
                      className="border-primary text-primary"
                    >
                      Applied
                    </Badge>
                  ) : null}
                  <Button
                    size="sm"
                    variant={isSelected ? "secondary" : "outline"}
                    onClick={() => onSelect(isSelected ? null : offer.id)}
                  >
                    {isSelected ? "Remove" : "Apply"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductComparison({
  current,
  alternative,
}: {
  current: ProductDetailData;
  alternative?: Product;
}) {
  const rows = [
    {
      label: "Price",
      current: inr(current.price),
      alt: alternative ? inr(alternative.price) : "—",
    },
    {
      label: "Wattage",
      current: current.wattage ? `${current.wattage} W` : "540 W",
      alt: "—",
    },
    {
      label: "Panel type",
      current: current.panel_type || "Mono PERC",
      alt: "—",
    },
    {
      label: "Warranty",
      current: current.warranty || "25y performance / 12y product",
      alt: "—",
    },
  ];
  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-foreground">
        Compare with similar items
      </h2>
      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-[1fr_repeat(2,minmax(0,1fr))] bg-muted/60 text-sm font-semibold text-foreground">
          <div className="px-4 py-3">Attribute</div>
          <div className="px-4 py-3">This product</div>
          <div className="px-4 py-3">
            {alternative ? alternative.title : "Another option"}
          </div>
        </div>
        <div className="divide-y divide-border text-sm">
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[1fr_repeat(2,minmax(0,1fr))]"
            >
              <div className="bg-muted/40 px-4 py-3 font-medium text-muted-foreground">
                {row.label}
              </div>
              <div className="px-4 py-3 text-foreground">{row.current}</div>
              <div className="px-4 py-3 text-muted-foreground">{row.alt}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SuggestedProducts({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <section className="mt-12">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          You might be interested
        </h2>
        <Link to="/products" className="text-sm font-medium text-primary">
          View all
        </Link>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <article
            key={product.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4"
          >
            <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg bg-muted/40">
              <img
                src={product.image}
                alt={product.title}
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                {product.title}
              </h3>
              <div className="text-sm font-extrabold text-foreground">
                {inr(product.price)}
              </div>
            </div>
            <Button asChild variant="outline">
              <Link
                to={`/products/${product.id}`}
                className="inline-flex items-center gap-1"
              >
                Choose option <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navState = (location.state as { product?: Product } | null) || null;
  const initialProduct = navState?.product
    ? toDetailProduct(navState.product)
    : null;
  const [product, setProduct] = useState<ProductDetailData | null>(
    initialProduct,
  );
  const [gallery, setGallery] = useState<string[]>(
    initialProduct ? [initialProduct.image] : [],
  );
  const [activeImage, setActiveImage] = useState<string>(
    initialProduct?.image ?? FALLBACK_PRODUCT_IMAGE,
  );
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { add } = useCart();

  useEffect(() => {
    if (!id) return;
    (async () => {
      if (!isSupabaseConfigured || !supabase) {
        const locals = readLocalProducts();
        const fallback = locals.find((item) => item.id === id);
        if (fallback) {
          const detailed = toDetailProduct(fallback);
          setProduct(detailed);
          const localGallery = [fallback.image || FALLBACK_PRODUCT_IMAGE];
          setGallery(localGallery);
          setActiveImage(localGallery[0]);
        }
        return;
      }

      const { data: productRow } = await supabase
        .from("products")
        .select(
          "id,title,price,mrp,images,badges,description,brand,wattage,panel_type,highlights,warranty,delivery_time,sku,availability,offers",
        )
        .eq("id", id)
        .maybeSingle();

      if (!productRow) {
        const locals = readLocalProducts();
        const fallback = locals.find((item) => item.id === id);
        if (fallback) {
          const detailed = toDetailProduct(fallback);
          setProduct(detailed);
          const localGallery = [fallback.image || FALLBACK_PRODUCT_IMAGE];
          setGallery(localGallery);
          setActiveImage(localGallery[0]);
        }
        return;
      }

      let relationalOffers: OfferDetail[] = [];
      try {
        const { data: offerLinks, error: linkError } = await supabase
          .from("product_offers")
          .select(
            "id, offer:offers(id,title,description,discount_type,discount_value,coupon_code,terms,badge)",
          )
          .eq("product_id", id)
          .eq("is_active", true);
        if (!linkError && offerLinks) {
          relationalOffers = offerLinks
            .map((link, index) => normaliseOffer(link.offer ?? link, index))
            .filter((offer): offer is OfferDetail => Boolean(offer));
        }
      } catch (error) {
        console.warn("product_offers relation lookup skipped", error);
      }

      const jsonOffers = Array.isArray(productRow.offers)
        ? productRow.offers
            .map((entry: unknown, index: number) =>
              normaliseOffer(entry, index),
            )
            .filter((offer): offer is OfferDetail => Boolean(offer))
        : [];

      const mergedOffers = dedupeOffers([...relationalOffers, ...jsonOffers]);

      const highlights = normaliseStringArray(productRow.highlights);
      const badges = normaliseStringArray(productRow.badges);
      const productGallery = ensureGallery(
        productRow.images,
        initialProduct?.image ?? FALLBACK_PRODUCT_IMAGE,
      );

      const detailed: ProductDetailData = {
        id: productRow.id,
        title: productRow.title,
        price: Number(productRow.price ?? 0),
        mrp:
          productRow.mrp !== null && productRow.mrp !== undefined
            ? Number(productRow.mrp)
            : (initialProduct?.mrp ?? null),
        image: productGallery[0] ?? FALLBACK_PRODUCT_IMAGE,
        badges: badges.length ? badges : (initialProduct?.badges ?? []),
        description:
          productRow.description ?? initialProduct?.description ?? null,
        brand: productRow.brand ?? initialProduct?.brand ?? null,
        wattage: productRow.wattage ?? initialProduct?.wattage ?? null,
        panel_type:
          productRow.panel_type ?? initialProduct?.panel_type ?? "Mono PERC",
        warranty: productRow.warranty ?? initialProduct?.warranty ?? null,
        delivery_time:
          productRow.delivery_time ?? initialProduct?.delivery_time ?? null,
        sku: productRow.sku ?? null,
        availability: productRow.availability ?? "Ready to ship",
        offers: mergedOffers.length ? mergedOffers : DEFAULT_OFFERS,
        highlights: highlights.length ? highlights : DEFAULT_HIGHLIGHTS,
      };

      setProduct(detailed);
      setGallery(productGallery);
      setActiveImage(productGallery[0] ?? FALLBACK_PRODUCT_IMAGE);
    })();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      if (!isSupabaseConfigured || !supabase) {
        const locals = readLocalProducts()
          .filter((item) => item.id !== id)
          .slice(0, 4);
        setRelatedProducts(locals);
        return;
      }
      const { data } = await supabase
        .from("products")
        .select("id,title,price,mrp,images,badges")
        .neq("id", id)
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(4);
      if (data) {
        setRelatedProducts(data.map(mapSupabaseProduct));
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!product?.offers.length) {
      setSelectedOfferId(null);
      return;
    }
    if (
      !selectedOfferId ||
      !product.offers.some((o) => o.id === selectedOfferId)
    ) {
      setSelectedOfferId(product.offers[0].id);
    }
  }, [product?.offers, selectedOfferId]);

  const selectedOffer = useMemo(
    () => product?.offers.find((offer) => offer.id === selectedOfferId) ?? null,
    [product?.offers, selectedOfferId],
  );

  const offerPricing = useMemo(() => {
    if (!product) return { finalPrice: 0, discountAmount: 0 };
    return calculateOfferPricing(product.price, selectedOffer);
  }, [product, selectedOffer]);

  const mrpSavings = useMemo(() => {
    if (!product?.mrp || product.mrp <= product.price) return 0;
    return Math.round(product.mrp - product.price);
  }, [product?.mrp, product?.price]);

  const totalSavings = offerPricing.discountAmount + mrpSavings;
  const specs = useMemo(() => buildSpecs(product), [product]);
  const descriptionText =
    product?.description ??
    "High-efficiency mono PERC module built for Indian conditions. Robust frame, excellent low-light performance and easy installation.";
  const warrantyText =
    product?.warranty ??
    "25-year linear performance warranty and 12-year product warranty covering manufacturing defects.";
  const deliveryText =
    product?.delivery_time ?? "Delivery within 5-7 business days across India.";

  if (!product) {
    return <section className="container py-12">Loading…</section>;
  }

  const handleAdd = (redirectToCart?: boolean) => {
    add({
      id: product.id,
      title: product.title,
      price: product.price,
      image: activeImage,
      mrp: product.mrp ?? null,
      offer: selectedOffer,
    });
    if (redirectToCart) navigate("/cart");
  };

  return (
    <section className="container py-12">
      <nav className="text-sm text-muted-foreground">
        <Link to="/products" className="hover:text-primary">
          Products
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.title}</span>
      </nav>
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-border bg-muted/30 p-6">
            <img
              src={activeImage}
              alt={product.title}
              className="h-full w-full object-contain"
            />
            {product.badges?.[0] && (
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                <Tag className="h-3.5 w-3.5" /> {product.badges[0]}
              </div>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {gallery.map((image) => {
                const isActive = image === activeImage;
                return (
                  <button
                    key={image}
                    onClick={() => setActiveImage(image)}
                    className={cn(
                      "flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border bg-muted/30 p-2",
                      isActive ? "border-primary" : "border-transparent",
                    )}
                  >
                    <img
                      src={image}
                      alt="Thumbnail"
                      className="max-h-full max-w-full object-contain"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-primary">
              <span>Waaree</span>
              {product.sku && (
                <span className="text-muted-foreground">
                  SKU: {product.sku}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">
              {product.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Trusted by 50,000+ installations
              </span>
              <span className="inline-flex items-center gap-1">
                <Truck className="h-4 w-4 text-primary" />
                Free delivery
              </span>
              <span className="inline-flex items-center gap-1">
                <Share2 className="h-4 w-4 text-primary" />
                Share
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-extrabold text-foreground">
                {inr(offerPricing.finalPrice || product.price)}
              </span>
              {product.mrp && product.mrp > product.price && (
                <span className="text-sm text-muted-foreground line-through">
                  {inr(product.mrp)}
                </span>
              )}
              {totalSavings > 0 && (
                <Badge variant="outline" className="border-accent text-accent">
                  Save {inr(totalSavings)}
                </Badge>
              )}
            </div>
            {selectedOffer && offerPricing.discountAmount > 0 ? (
              <p className="text-sm text-muted-foreground">
                Offer applied: {selectedOffer.title} — you save{" "}
                {inr(offerPricing.discountAmount)}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="h-11 px-6" onClick={() => handleAdd(false)}>
              Add to cart
            </Button>
            <Button
              variant="outline"
              className="h-11 px-6"
              onClick={() => handleAdd(true)}
            >
              Buy now
            </Button>
          </div>
          <div className="grid gap-3 text-sm text-muted-foreground">
            <p>{descriptionText}</p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <ShieldCheck className="h-3.5 w-3.5" /> Warranty support
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-semibold text-foreground">
                <Truck className="h-3.5 w-3.5 text-primary" /> {deliveryText}
              </span>
            </div>
          </div>
          <OfferList
            offers={product.offers}
            selectedOfferId={selectedOfferId}
            onSelect={setSelectedOfferId}
            basePrice={product.price}
          />
          <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              7-day replacement guarantee for transit damage
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Earn up to ₹2,000 referral credits on successful installation
            </div>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              Need bulk pricing? Contact solar@waaree.com for project quotes.
            </div>
          </div>
        </div>
      </div>
      <FeatureHighlights />
      <InfoTabs
        descriptionText={descriptionText}
        highlights={product.highlights}
        specs={specs}
        warrantyText={warrantyText}
        deliveryText={deliveryText}
      />
      <ProductComparison current={product} alternative={relatedProducts[0]} />
      <SuggestedProducts products={relatedProducts} />
    </section>
  );
}
