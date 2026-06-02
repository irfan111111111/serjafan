export type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
};

export type Promo = {
  id: string;
  code: string;
  title: string;
  description: string;
  categoryId: string;
  discount: number;
  active: boolean;
};

export type PartnerReview = {
  id: string;
  partnerId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export const serviceCategories: ServiceCategory[] = [
  { id: "SC-DUPLIKAT", name: "Duplikat Kunci", slug: "duplikat-kunci", icon: "KeyRound", description: "Duplikat kunci rumah, motor, dan mobil." },
  { id: "SC-PLAT-NOMOR", name: "Plat Nomor", slug: "plat-nomor", icon: "ShieldCheck", description: "Pembuatan plat nomor dan aksesoris kendaraan." },
  { id: "SC-CUCI-SEPATU", name: "Cuci Sepatu", slug: "cuci-sepatu", icon: "Sparkles", description: "Cuci, deep clean, dan restore sepatu." },
  { id: "SC-SERVIS-KIPAS", name: "Servis Kipas", slug: "servis-kipas", icon: "Wrench", description: "Servis kipas, AC, dan peralatan rumah tangga." },
  { id: "SC-FOTOKOPI", name: "Fotokopi", slug: "fotokopi", icon: "Copy", description: "Layanan fotokopi, print, dan scan." },
  { id: "SC-CLEANING", name: "Cleaning", slug: "cleaning", icon: "Sparkles", description: "Home cleaning, office cleaning, dan general cleaning." },
  { id: "SC-JASTIP", name: "Jastip", slug: "jastip", icon: "ShoppingBag", description: "Jasa titip lokal dan lintas kota." }
];

export const promos: Promo[] = [];

export const partnerReviews: PartnerReview[] = [];

export const serviceMetaByPartnerId: Record<
  string,
  {
    headline: string;
    description: string;
    serviceCategoryIds: string[];
  }
> = {};
