"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Bike,
  Bolt,
  Calendar,
  Camera,
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  Heart,
  Home,
  ImageIcon,
  KeyRound,
  Loader2,
  LogIn,
  MapPin,
  MessageCircle,
  Inbox,
  Navigation,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Upload,
  ListOrdered,
  UserCircle,
  UserPlus,
  Wallet,
  Wrench,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Screen =
  | "home"
  | "search"
  | "partnerList"
  | "detail"
  | "order"
  | "orders"
  | "tracking"
  | "profile"
  | "wallet"
  | "topup"
  | "walletHistory"
  | "editProfile"
  | "partnerWallet"
  | "partnerTopup"
  | "partnerTransfer"
  | "partnerWalletHistory"
  | "partner"
  | "partnerAccount"
  | "admin";
type PayMethod = "SERJAFAN Pay" | "Transfer Bank/DANA Mitra" | "Tunai";
type PromoStatus = "idle" | "valid" | "invalid";
type ToastKind = "success" | "error";
type AppRole = "customer" | "partner" | "admin" | "switcher";
type FulfillmentMode = "PARTNER_TO_CUSTOMER" | "CUSTOMER_TO_PARTNER";

type CurrentUser = {
  id: string;
  name: string;
  location: string;
  walletBalance: number;
  phone?: string;
  image?: string | null;
};

type Partner = {
  id: string;
  name: string;
  category: string;
  distance: string;
  rating: string;
  reviews: string;
  orders: string;
  eta: string;
  status: "Online" | "Sibuk";
  priceFrom: number;
  phone?: string | null;
  paymentBankName?: string | null;
  paymentBankAccount?: string | null;
  paymentBankHolder?: string | null;
  paymentDanaNumber?: string | null;
  paymentDanaName?: string | null;
  acceptsCash?: boolean | null;
  tone: string;
  Icon: React.ElementType;
};

type OrderDraft = {
  partnerId: string;
  serviceCategoryId: string;
  address: string;
  addressNote: string;
  schedule: string;
  scheduleNote: string;
  fulfillmentMode: FulfillmentMode;
  note: string;
  noteMeta: string;
  paymentMethod: PayMethod;
  promoCode: string;
  promoStatus: PromoStatus;
  serviceFee: number;
  platformFee: number;
  discount: number;
};

type LastOrder = {
  id: string;
  partner: Partner;
  total: number;
  status: "pending" | "confirmed" | "partner_ready" | "on_the_way" | "done";
};

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  kind: string;
  createdAt: string;
  isRead?: boolean;
};

type MessageThread = {
  id: string;
  title: string;
  body: string;
  sender: string;
  orderId?: string | null;
  partnerId?: string | null;
  partnerName?: string | null;
  serviceName?: string | null;
  attachmentImage?: string | null;
  unread: boolean;
  createdAt?: string;
};

type NotificationPreferences = {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  soundTone: "classic" | "soft" | "urgent" | "custom";
  customRingtoneName?: string | null;
  customRingtoneData?: string | null;
};

type ManualTopUpMeta = {
  senderName: string;
  reference: string;
  proofImage: string;
};

type WalletTransaction = {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
};

type MapPoint = {
  label: string;
  address: string;
  lat: number;
  lng: number;
  role: "customer" | "partner";
};

type ConnectedRoute = {
  origin: MapPoint;
  destination: MapPoint;
  status?: string;
  eta?: string;
  orderId?: string;
  mode?: FulfillmentMode;
};

type AdminMapPair = {
  orderId: string;
  status: string;
  serviceCategoryId: string;
  customer: {
    id: string;
    label: string;
    address: string;
    latitude: number;
    longitude: number;
    lastSignal: string;
  };
  partner: {
    id: string;
    label: string;
    address: string;
    latitude: number;
    longitude: number;
    status: string;
    lastSignal: string;
  };
};

type AdminMapData = {
  pairs: AdminMapPair[];
  summary: {
    monitoredOrders: number;
    monitoredCustomers: number;
    monitoredPartners: number;
  };
};

type AdminConsoleData = {
  settings: {
    services: { id: string; name: string; fee: number; active: boolean; description: string }[];
    promos: {
      code: string;
      discount: number;
      active: boolean;
      note: string;
      title?: string;
      description?: string;
      mediaUrl?: string;
      mediaType?: "image" | "video" | null;
    }[];
    partnerRequirements: { id: string; label: string; required: boolean }[];
    partnerFeatureCopy: { headline: string; description: string };
    customerFeatureCopy: { headline: string; description: string };
    partnerRegistrationLimited: boolean;
  };
  customers: any[];
  partners: any[];
};

type PromoBanner = {
  code: string;
  title: string;
  description?: string;
  note?: string;
  discount: number;
  active?: boolean;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | null;
};

type AdminWalletData = {
  wallets: Array<{
    walletId: string;
    userId: string;
    balance: number;
    currency: string;
    updatedAt: string;
    name: string | null;
    email: string | null;
    role: "CUSTOMER" | "PARTNER" | "ADMIN" | null;
  }>;
  transactions: WalletTransaction[];
  pendingTopups?: Array<{
    id: string;
    userId: string;
    provider: string;
    channel: string;
    amount: number;
    status: string;
    rawPayload?: string | null;
    createdAt?: string | Date;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  }>;
  summary: {
    totalWallets: number;
    totalBalance: number;
    customerWallets: number;
    partnerWallets: number;
  };
};

type AdminAuditData = {
  summary: {
    grossOrderValue: number;
    completedOrders: number;
    paidTopupAmount: number;
    paidTopupCount: number;
    pendingTopupAmount: number;
    pendingTopupCount: number;
    platformCommissionAmount: number;
    platformCommissionCount: number;
    customerPaymentAmount: number;
    refundAmount: number;
    walletLiability: number;
    customerWalletBalance: number;
    partnerDepositBalance: number;
  };
  recentAuditLogs: Array<{
    id: string;
    actorRole?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    severity: "INFO" | "WARN" | "ERROR" | "CRITICAL";
    createdAt?: string | Date;
  }>;
};

type AdminSettings = {
  platformFee: number;
  promoCode: string;
  promoDiscount: number;
  serviceArea: string;
  supportPhone: string;
  manualBankName: string;
  manualBankAccount: string;
  manualBankHolder: string;
  manualDanaNumber: string;
  manualDanaName: string;
  manualQrisName: string;
};

const currentUser: CurrentUser = {
  id: "",
  name: "Customer",
  location: "Kota Padang",
  walletBalance: 0
};

const partners: Partner[] = [];

const emptyPartner: Partner = {
  id: "",
  name: "Belum ada mitra",
  category: "Jasa",
  distance: "-",
  rating: "-",
  reviews: "0",
  orders: "0",
  eta: "-",
  status: "Sibuk",
  priceFrom: 0,
  phone: null,
  tone: "bg-slate-100 text-slate-700",
  Icon: Wrench
};

const customerMapPoint: MapPoint = {
  label: "Customer - Kota Padang",
  address: "Kota Padang, Sumatera Barat",
  lat: -0.9471,
  lng: 100.4172,
  role: "customer"
};

const partnerMapPoints: Record<string, MapPoint> = {
  default: {
    label: "Mitra - Kota Padang",
    address: "Kota Padang, Sumatera Barat",
    lat: -0.9471,
    lng: 100.4172,
    role: "partner"
  }
};

const services = [
  { name: "Duplikat Kunci", icon: KeyRound, tone: "bg-blue-50 text-blue-700" },
  { name: "Cuci Sepatu", icon: Sparkles, tone: "bg-emerald-50 text-emerald-700" },
  { name: "Servis Kipas", icon: Wrench, tone: "bg-orange-50 text-orange-700" },
  { name: "Cleaning", icon: Sparkles, tone: "bg-violet-50 text-violet-700" },
  { name: "Jastip", icon: ShoppingBag, tone: "bg-rose-50 text-rose-700" },
  { name: "AC Service", icon: Wrench, tone: "bg-cyan-50 text-cyan-700" },
  { name: "Salon Rumah", icon: Star, tone: "bg-amber-50 text-amber-700" },
  { name: "Lainnya", icon: Bolt, tone: "bg-slate-100 text-slate-700" }
];

type ServiceItem = {
  id?: string;
  name: string;
  icon: React.ElementType;
  tone: string;
  basePrice?: number;
  description?: string;
};
type PartnerItem = Partner;

const serviceIconByName = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes("kunci")) return KeyRound;
  if (normalized.includes("plat") || normalized.includes("nomor") || normalized.includes("kendaraan")) return ShieldCheck;
  if (normalized.includes("sepatu") || normalized.includes("clean")) return Sparkles;
  if (normalized.includes("jastip")) return ShoppingBag;
  if (normalized.includes("salon")) return Star;
  if (normalized.includes("foto") || normalized.includes("print") || normalized.includes("copy")) return ListOrdered;
  if (normalized.includes("kipas") || normalized.includes("ac") || normalized.includes("servis")) return Wrench;
  return Bolt;
};

const serviceDisplayName = (name: string) => (name.toLowerCase().startsWith("jasa ") ? name : `Jasa ${name}`);

const customerCategoryLabel = (name: string) => {
  const normalized = serviceDisplayName(name).replace(/^Jasa\s+/i, "");
  const aliases: Record<string, string> = {
    "Duplikat Kunci": "Kunci",
    "Cuci Sepatu": "Cuci Sepatu",
    "Servis Kipas": "Servis Kipas",
    "Plat Nomor": "Plat Nomor",
    "Foto Kopi": "Fotokopi",
    Fotocopy: "Fotokopi",
    Fotokopi: "Fotokopi"
  };
  return aliases[normalized] ?? normalized;
};

const serviceDashboardImage = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes("ac") || normalized.includes("kipas")) return "/service-ac.svg";
  if (normalized.includes("kunci")) return "/service-locksmith.svg";
  return "/service-electrician.svg";
};

const serviceCategoryKey = (name: string) => name.trim().toLowerCase().replace(/^jasa\s+/, "");

const serviceShortCopy = (service: ServiceItem) =>
  service.description?.trim() ||
  (service.name.toLowerCase().includes("kunci")
    ? "Duplikat kunci rumah, motor, mobil, dan panggilan darurat."
    : service.name.toLowerCase().includes("plat")
      ? "Pembuatan dan perapian plat nomor kendaraan."
      : service.name.toLowerCase().includes("sepatu")
        ? "Cuci, deep clean, dan perawatan sepatu."
        : "Pesan layanan SERJAFAN dan tim operasional akan menugaskan teknisi internal.");

const serviceToneByIndex = (index: number) =>
  [
    "bg-blue-50 text-blue-700",
    "bg-emerald-50 text-emerald-700",
    "bg-orange-50 text-orange-700",
    "bg-violet-50 text-violet-700",
    "bg-rose-50 text-rose-700",
    "bg-cyan-50 text-cyan-700",
    "bg-amber-50 text-amber-700",
    "bg-slate-100 text-slate-700"
  ][index % 8];

const initialDraft: OrderDraft = {
  partnerId: "",
  serviceCategoryId: "",
  address: "",
  addressNote: "Kota Padang, Sumatera Barat",
  schedule: "Sekarang (ASAP)",
  scheduleNote: "Estimasi tiba ~15 menit",
  fulfillmentMode: "PARTNER_TO_CUSTOMER",
  note: "",
  noteMeta: "Tanpa catatan tambahan",
  paymentMethod: "SERJAFAN Pay",
  promoCode: "",
  promoStatus: "idle",
  serviceFee: 30000,
  platformFee: 3000,
  discount: 0
};

const roleTabs: { value: Screen; label: string }[] = [
  { value: "home", label: "Customer" },
  { value: "partner", label: "Teknisi" },
  { value: "admin", label: "Admin" }
];

const initialScreenByRole: Record<AppRole, Screen> = {
  customer: "home",
  partner: "partner",
  admin: "admin",
  switcher: "home"
};

const appTitleByRole: Record<AppRole, string> = {
  customer: "SERJAFAN Customer",
  partner: "SERJAFAN Teknisi",
  admin: "SERJAFAN Admin",
  switcher: "SERJAFAN"
};

function BrandMark({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", compact && "min-w-0")}>
      <span className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-white shadow-sm", compact ? "h-10 w-10" : "h-14 w-14")}>
        <img src="/serjafan-logo.png" alt="SERJAFAN" className={cn("h-full w-full object-contain", compact ? "p-1" : "p-1.5")} />
      </span>
      {!compact && (
        <div>
          <p className={cn("text-base font-black leading-none", light ? "text-white" : "text-navy")}>SERJAFAN</p>
          <p className={cn("text-[9px] font-bold tracking-[0.18em]", light ? "text-white/60" : "text-slate-400")}>PADANG</p>
        </div>
      )}
    </div>
  );
}

function CustomerWordmark() {
  return (
    <div className="flex min-w-0 items-center">
      <span className="flex h-[58px] w-[160px] shrink-0 items-center overflow-hidden rounded-[18px] bg-white px-2.5 py-1.5 shadow-[0_12px_24px_rgba(0,24,92,0.18)]">
        <img src="/serjafan-logo.png" alt="SERJAFAN" className="h-full w-full object-contain" />
      </span>
    </div>
  );
}

const initialAdminSettings: AdminSettings = {
  platformFee: 3000,
  promoCode: "",
  promoDiscount: 0,
  serviceArea: "Kota Padang",
  supportPhone: "+62xxxxxxxxxx",
  manualBankName: "Bank SERJAFAN",
  manualBankAccount: "Isi nomor rekening usaha SERJAFAN di admin",
  manualBankHolder: "SERJAFAN",
  manualDanaNumber: "Isi nomor DANA SERJAFAN di admin",
  manualDanaName: "Isi nama akun DANA SERJAFAN di admin",
  manualQrisName: "QRIS usaha SERJAFAN"
};

const initialAdminConsole: AdminConsoleData = {
  settings: {
    services: [],
    promos: [],
    partnerRequirements: [],
    partnerFeatureCopy: { headline: "Jaringan Teknisi SERJAFAN", description: "" },
    customerFeatureCopy: { headline: "Customer App", description: "" },
    partnerRegistrationLimited: false
  },
  customers: [],
  partners: []
};

const initialAdminWalletData: AdminWalletData = {
  wallets: [],
  transactions: [],
  summary: {
    totalWallets: 0,
    totalBalance: 0,
    customerWallets: 0,
    partnerWallets: 0
  }
};

const initialAdminAuditData: AdminAuditData = {
  summary: {
    grossOrderValue: 0,
    completedOrders: 0,
    paidTopupAmount: 0,
    paidTopupCount: 0,
    pendingTopupAmount: 0,
    pendingTopupCount: 0,
    platformCommissionAmount: 0,
    platformCommissionCount: 0,
    customerPaymentAmount: 0,
    refundAmount: 0,
    walletLiability: 0,
    customerWalletBalance: 0,
    partnerDepositBalance: 0
  },
  recentAuditLogs: []
};


const formatRupiah = (value: number) => new Intl.NumberFormat("id-ID").format(value);
const cleanText = (value: unknown) => String(value ?? "").trim();
const hasCompletePartnerBank = (partner?: Partial<Partner> | null) =>
  Boolean(cleanText(partner?.paymentBankName) && cleanText(partner?.paymentBankAccount) && cleanText(partner?.paymentBankHolder));
const hasCompletePartnerDana = (partner?: Partial<Partner> | null) =>
  Boolean(cleanText(partner?.paymentDanaNumber) && cleanText(partner?.paymentDanaName));
const hasPartnerDirectPayment = (partner?: Partial<Partner> | null) => hasCompletePartnerBank(partner) || hasCompletePartnerDana(partner);
const readManualTopUpPayload = (rawPayload?: string | null): { senderName?: string; reference?: string; proofImage?: string; mode?: string } => {
  if (!rawPayload) return {};
  try {
    const parsed = JSON.parse(rawPayload) as { senderName?: string; reference?: string; proofImage?: string; mode?: string };
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};
const orderTotal = (draft: OrderDraft) => Math.max(0, draft.serviceFee + draft.platformFee - draft.discount);
const paymentChannelFromLabel = (label: string) => {
  if (label.includes("Transfer Bank")) return "BANK_TRANSFER";
  if (label.includes("BCA")) return "BCA_VA";
  if (label.includes("BRI")) return "BRI_VA";
  if (label.includes("BNI")) return "BNI_VA";
  if (label.includes("Mandiri")) return "MANDIRI_VA";
  if (label.includes("Permata")) return "PERMATA_VA";
  if (label.includes("DANA")) return "DANA";
  if (label.includes("OVO")) return "OVO";
  if (label.includes("GoPay")) return "GOPAY";
  if (label.includes("ShopeePay")) return "SHOPEEPAY";
  if (label.includes("Kartu")) return "CARD";
  return "QRIS";
};
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }
  return outputArray;
};
const getPartnerMapPoint = (partnerId?: string | null, partner?: Partner): MapPoint => {
  const point = partnerMapPoints[partnerId ?? ""] ?? partnerMapPoints.default;
  return {
    ...point,
    label: partner?.name ? `${partner.name} - ${partner.category}` : point.label,
    address: partner?.name ? `${partner.name}, ${partner.category}, Kota Padang, Sumatera Barat` : point.address
  };
};
const normalizePartner = (value?: any): Partner | null => {
  if (!value?.id) return null;
  return {
    ...emptyPartner,
    ...value,
    name: value.name ?? emptyPartner.name,
    category: value.category ?? emptyPartner.category,
    distance: value.distance ?? `${value.distanceKm ?? 0} km`,
    rating: value.rating ? String(value.rating) : emptyPartner.rating,
    reviews: value.reviews ?? String(value.reviewCount ?? 0),
    orders: value.orders ?? `${value.completedOrders ?? 0}+`,
    eta: value.eta ?? `~${value.etaMinutes ?? 15} min`,
    status: value.status === "ONLINE" || value.status === "Online" ? "Online" : value.status === "BUSY" || value.status === "Sibuk" ? "Sibuk" : emptyPartner.status,
    priceFrom: value.priceFrom ?? emptyPartner.priceFrom,
    tone: value.tone ?? serviceToneByIndex(0),
    Icon: value.Icon ?? serviceIconByName(value.category ?? "Jasa")
  };
};
const getPartnerByOrder = (order?: any, fallback?: Partner) => normalizePartner(order?.partner) ?? partners.find((partner) => partner.id === (order?.partnerId ?? order?.partner?.id)) ?? fallback ?? emptyPartner;
const partnerFromProfile = (profile?: any | null): Partner =>
  profile
    ? {
        id: profile.id ?? "",
        name: profile.name ?? "Partner SERJAFAN",
        category: profile.category ?? "Jasa",
        distance: `${profile.distanceKm ?? 0} km`,
        rating: Number(profile.rating ?? 0).toFixed(1),
        reviews: String(profile.reviewCount ?? 0),
        orders: `${profile.completedOrders ?? 0}+`,
        eta: `~${profile.etaMinutes ?? 15} min`,
        status: profile.status === "ONLINE" ? "Online" : "Sibuk",
        priceFrom: profile.priceFrom ?? 0,
        phone: profile.contactPhone ?? null,
        paymentBankName: profile.paymentBankName ?? null,
        paymentBankAccount: profile.paymentBankAccount ?? null,
        paymentBankHolder: profile.paymentBankHolder ?? null,
        paymentDanaNumber: profile.paymentDanaNumber ?? null,
        paymentDanaName: profile.paymentDanaName ?? null,
        acceptsCash: profile.acceptsCash ?? true,
        tone: serviceToneByIndex(0),
        Icon: serviceIconByName(profile.category ?? "Jasa")
      }
    : emptyPartner;
const routeForOrder = (order?: any, fallbackPartner?: Partner, mode: FulfillmentMode = "PARTNER_TO_CUSTOMER"): ConnectedRoute => {
  const partner = getPartnerByOrder(order, fallbackPartner);
  const resolvedMode = (order?.fulfillmentMode as FulfillmentMode | undefined) ?? mode;
  const customerPoint = {
    ...customerMapPoint,
    label: order?.customerName ? `${order.customerName} - Customer` : customerMapPoint.label,
    address: [order?.addressTitle, order?.addressSubtitle].filter(Boolean).join(", ") || customerMapPoint.address
  };
  const partnerPoint = getPartnerMapPoint(partner.id, partner);

  return {
    origin: resolvedMode === "PARTNER_TO_CUSTOMER" ? partnerPoint : customerPoint,
    destination: resolvedMode === "PARTNER_TO_CUSTOMER" ? customerPoint : partnerPoint,
    status: order?.status ?? "ACTIVE",
    eta: partner.eta,
    orderId: order?.id,
    mode: resolvedMode
  };
};

const googleMapsDirectionsUrl = (route: ConnectedRoute) => {
  const origin = mapLocationQuery(route.origin);
  const destination = mapLocationQuery(route.destination);
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
};

const mapLocationQuery = (point: MapPoint) => {
  const address = point.address.trim();
  const genericPadang = address.toLowerCase() === "kota padang, sumatera barat" || address.toLowerCase() === "kota padang";
  return address && !genericPadang ? address : `${point.lat},${point.lng}`;
};

const demoActors: Record<"CUSTOMER" | "PARTNER" | "ADMIN", { userId: string }> = {
  CUSTOMER: { userId: "usr_customer_session" },
  PARTNER: { userId: "usr_partner_session" },
  ADMIN: { userId: "usr_admin_serjafan" }
};

type StoredSession = {
  userId: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "PARTNER" | "ADMIN";
  home: string;
  token?: string;
  expiresAt?: string;
};

type CustomerGuestResponse = {
  data?: {
    session: StoredSession;
    deviceId: string;
  };
  error?: { message?: string };
};

const sessionStorageKey = (role: "CUSTOMER" | "PARTNER" | "ADMIN") => `serjafan-session-${role.toLowerCase()}`;
const customerProfileStorageKey = "serjafan-customer-profile";

function isCustomerProfileReady(user?: Partial<CurrentUser> | null) {
  const name = user?.name?.trim() ?? "";
  const phone = user?.phone?.trim() ?? "";
  const location = user?.location?.trim() ?? "";
  return Boolean(name && name.toLowerCase() !== "customer" && phone && location.length >= 12 && location.toLowerCase() !== "kota padang");
}

function getStoredCustomerProfile() {
  if (typeof window === "undefined") return null;
  try {
    const profile = JSON.parse(window.localStorage.getItem(customerProfileStorageKey) ?? "null") as Partial<CurrentUser> | null;
    return isCustomerProfileReady(profile) ? profile : null;
  } catch {
    return null;
  }
}

function storeCustomerProfile(profile: Partial<CurrentUser>) {
  if (typeof window === "undefined") return;
  const current = getStoredCustomerProfile() ?? {};
  window.localStorage.setItem(customerProfileStorageKey, JSON.stringify({ ...current, ...profile }));
}

function getStoredSession(role: "CUSTOMER" | "PARTNER" | "ADMIN") {
  if (typeof window === "undefined") return null;
  try {
    const session = JSON.parse(window.localStorage.getItem(sessionStorageKey(role)) ?? window.localStorage.getItem("serjafan-session") ?? "null") as StoredSession | null;
    if (!session?.token || session.role !== role) return null;
    if (session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(sessionStorageKey(role));
      return null;
    }
    window.localStorage.setItem(sessionStorageKey(role), JSON.stringify(session));
    return session;
  } catch {
    return null;
  }
}

function getOrCreateDeviceId() {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem("serjafan-customer-device");
  if (existing) return existing;
  const generated = crypto.randomUUID().replaceAll("-", "").slice(0, 24);
  window.localStorage.setItem("serjafan-customer-device", generated);
  return generated;
}

function storeSession(session: StoredSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(sessionStorageKey(session.role), JSON.stringify(session));
}

function clearStoredSession(role: "CUSTOMER" | "PARTNER" | "ADMIN") {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(sessionStorageKey(role));
}

async function ensureCustomerGuestSession() {
  if (typeof window === "undefined") return null;
  const existing = getStoredSession("CUSTOMER");
  if (existing?.token) return existing;

  const response = await fetch("/api/customer/guest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ deviceId: getOrCreateDeviceId() })
  });
  const payload = (await parseJsonResponse(response)) as { data?: { session?: StoredSession }; error?: { message?: string } };
  if (!response.ok || !payload.data?.session) {
    throw new Error(payload.error?.message ?? "Gagal menyiapkan akses customer.");
  }
  storeSession(payload.data.session);
  return payload.data.session;
}

async function saveCustomerAccessProfile(profile: { name: string; phone: string; location: string; profilePhoto?: string | null }) {
  if (typeof window === "undefined") return null;
  const response = await fetch("/api/customer/access", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...profile, deviceId: getOrCreateDeviceId() })
  });
  const payload = (await parseJsonResponse(response)) as {
    data?: {
      session?: StoredSession;
      user?: CurrentUser;
      deviceId?: string;
    };
    error?: { message?: string };
  };
  if (!response.ok || !payload.data?.session || !payload.data?.user) {
    throw new Error(payload.error?.message ?? "Akses customer gagal disimpan.");
  }
  const session = payload.data.session;
  const user = payload.data.user;
  if (payload.data.deviceId) window.localStorage.setItem("serjafan-customer-device", payload.data.deviceId);
  storeSession(session);
  storeCustomerProfile({
    id: user.id,
    name: user.name,
    phone: user.phone,
    location: user.location,
    image: user.image ?? null
  });
  return { session, user, deviceId: payload.data.deviceId };
}

class ApiRequestError extends Error {
  status: number;

  constructor(status: number) {
    super(`Request failed: ${status}`);
    this.status = status;
  }
}

async function apiFetch(path: string, role: "CUSTOMER" | "PARTNER" | "ADMIN", init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const session = getStoredSession(role);
  headers.set("x-serjafan-role", role);
  headers.set("x-serjafan-user-id", session?.userId ?? demoActors[role].userId);
  if (session?.token) {
    headers.set("authorization", `Bearer ${session.token}`);
  }
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return fetch(path, { ...init, headers });
}

async function readApi<T>(path: string, role: "CUSTOMER" | "PARTNER" | "ADMIN") {
  const response = await apiFetch(path, role);
  if (!response.ok) throw new ApiRequestError(response.status);
  return (await parseJsonResponse(response)) as { data: T };
}

export default function HomePage() {
  return <AppLauncher />;
}

export function AppLauncher() {
  const [adminCanRegister, setAdminCanRegister] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/register/admin", { cache: "no-store" })
      .then((response) => parseJsonResponse(response))
      .then((payload) => {
        if (active) setAdminCanRegister(Boolean(payload?.data?.canRegister));
      })
      .catch(() => {
        if (active) setAdminCanRegister(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const apps = [
    {
      href: "/customer",
      title: "SERJAFAN Customer",
      description: "Aplikasi pelanggan untuk pesan layanan SERJAFAN, bayar, tracking, dan bantuan CS.",
      Icon: Home,
      tone: "bg-blue-50 text-blue-700",
      actions: [{ href: "/customer", label: "Buka Customer", primary: true }]
    },
    {
      href: "/admin",
      title: "SERJAFAN Admin",
      description: "Dashboard operasional untuk menerima order, menghubungi customer, menugaskan teknisi lapangan, monitoring kualitas, pembayaran, dan konfigurasi.",
      Icon: ShieldCheck,
      tone: "bg-orange-50 text-orange-700",
      actions: [
        { href: "/login/admin", label: "Buka Login Admin", primary: true },
        ...(adminCanRegister ? [{ href: "/register/admin", label: "Daftar Admin" }] : [])
      ]
    }
  ];
  const landingServices = services.slice(0, 8);
  const landingStats = [
    { value: "Kota Padang", label: "fokus area layanan" },
    { value: `${landingServices.length}+`, label: "kategori jasa siap tampil" },
    { value: "V1", label: "order dikelola langsung SERJAFAN" },
    { value: "4", label: "halaman SEO layanan lokal" }
  ];
  const valueProps = [
    { Icon: Phone, title: "Respon dari tim SERJAFAN", body: "Customer cukup kirim kebutuhan. Tim SERJAFAN menghubungi customer, mencatat detail, dan mengatur teknisi lapangan." },
    { Icon: ShieldCheck, title: "Teknisi ditugaskan oleh SERJAFAN", body: "Customer tidak memilih teknisi sendiri. SERJAFAN menugaskan teknisi yang sesuai agar kualitas tetap terkontrol." },
    { Icon: Wallet, title: "Pembayaran dipantau admin", body: "SERJAFAN mengelola instruksi pembayaran, bukti transfer, tunai, riwayat saldo, dan pemantauan pembayaran." }
  ];
  const steps = ["Pilih layanan", "Isi detail kebutuhan", "Tim SERJAFAN menghubungi Anda", "Teknisi ditugaskan", "Pekerjaan selesai"];
  const proofCards = [
    { title: "Form order customer", label: "Customer App", body: "Pengunjung dapat mencoba alur customer langsung dari website, termasuk cari layanan, isi alamat, dan kirim kebutuhan ke SERJAFAN.", Icon: Home, tone: "bg-blue-100 text-blue-700" },
    { title: "Admin menerima order", label: "Admin Dashboard", body: "Admin mengelola layanan, promo, customer, top up manual, maps, keluhan, dan assignment teknisi lapangan.", Icon: ShieldCheck, tone: "bg-orange-100 text-orange-700" },
    { title: "Komunikasi terpusat", label: "SERJAFAN Support", body: "Customer berkomunikasi dengan SERJAFAN, bukan langsung dengan teknisi. Ini lebih realistis untuk launch awal.", Icon: MessageCircle, tone: "bg-emerald-100 text-emerald-700" }
  ];
  const faqs = [
    { q: "Bagaimana cara pesan jasa di SERJAFAN?", a: "Buka aplikasi customer, isi data pelanggan, pilih layanan, isi detail kebutuhan, lalu kirim pesanan ke SERJAFAN." },
    { q: "Apakah customer memilih teknisi?", a: "Tidak. SERJAFAN menerima order, menghubungi customer bila perlu, lalu menugaskan teknisi lapangan yang sesuai." },
    { q: "Bagaimana pembayaran dilakukan?", a: "Pembayaran dikelola SERJAFAN melalui metode yang tersedia seperti saldo SERJAFAN, transfer manual, atau tunai sesuai kebijakan layanan." },
    { q: "Bagaimana jika ada kendala?", a: "Customer berkomunikasi dengan SERJAFAN. Admin memantau pesanan, teknisi, pembayaran, dan komplain." }
  ];
  const seoLinks = [
    { href: "/layanan/service-ac-padang", label: "Service AC Padang" },
    { href: "/layanan/tukang-kunci-padang", label: "Tukang Kunci Padang" },
    { href: "/layanan/cuci-sepatu-padang", label: "Cuci Sepatu Padang" },
    { href: "/layanan/cleaning-service-padang", label: "Cleaning Service Padang" }
  ];
  const dashboardScreens = [
    {
      title: "Customer App",
      subtitle: "Pesan layanan SERJAFAN",
      Icon: Home,
      tone: "from-[#0d47d9] to-[#003cb5]",
      metrics: [
        ["Status", "Diterima"],
        ["CS", "Aktif"],
        ["Tracking", "Live"]
      ],
      rows: ["Pilih layanan", "Isi alamat & kebutuhan", "Pantau status dari SERJAFAN"]
    },
    {
      title: "Admin Order Desk",
      subtitle: "Order diterima tim SERJAFAN",
      Icon: Inbox,
      tone: "from-emerald-600 to-emerald-800",
      metrics: [
        ["Order", "Masuk"],
        ["CS", "Follow up"],
        ["Teknisi", "Ditugaskan"]
      ],
      rows: ["Hubungi customer", "Cari teknisi lapangan", "Update status pekerjaan"]
    },
    {
      title: "Tracking & Support",
      subtitle: "Customer memantau status",
      Icon: MessageCircle,
      tone: "from-orange-500 to-orange-700",
      metrics: [
        ["Status", "Jelas"],
        ["Admin", "Siaga"],
        ["Bantuan", "Aktif"]
      ],
      rows: ["Menunggu konfirmasi", "Sedang diproses", "Teknisi menuju lokasi"]
    }
  ];
  const trustAssets = [
    { title: "Foto tim lapangan asli", body: "Gunakan foto teknisi lapangan SERJAFAN setelah verifikasi, bukan avatar generik.", Icon: Camera },
    { title: "Bukti pekerjaan selesai", body: "Kumpulkan foto before-after dari service AC, kunci, dan cleaning saat pilot pertama.", Icon: ImageIcon },
    { title: "Testimoni nyata", body: "Tampilkan nama, layanan, area Padang, dan ulasan singkat dari customer pertama.", Icon: Star },
    { title: "Statistik real-time", body: "Angka order selesai, rating, dan waktu respons baru ditampilkan setelah data production benar-benar ada.", Icon: Bolt }
  ];
  const pilotMilestones = [
    ["Minggu 1", "Siapkan 10 kontak teknisi lapangan untuk kunci, AC, dan cleaning tanpa memaksa mereka memakai dashboard dulu."],
    ["Minggu 2", "Kumpulkan foto pekerjaan, profil lapangan, dan bukti verifikasi sederhana."],
    ["Minggu 3", "Jalankan 20-50 order pilot dan simpan ulasan customer."],
    ["Minggu 4", "Tampilkan statistik nyata, testimoni asli, lalu mulai iklan Padang."]
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f7fb] text-slate-950">
      <section className="relative bg-gradient-to-br from-[#061b56] via-[#0d47d9] to-[#003cb5] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,213,74,0.22),transparent_34%),radial-gradient(circle_at_10%_20%,rgba(255,255,255,0.14),transparent_26%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 pb-12 pt-6 md:grid-cols-[1.05fr_0.95fr] md:px-6 md:pb-16">
          <div>
            <div className="flex items-center justify-between gap-4">
              <CustomerWordmark />
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/12 px-3 py-2 text-xs font-extrabold">
                <MapPin className="h-4 w-4" /> Padang
              </span>
            </div>
            <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#ffd54a]">
              <Sparkles className="h-4 w-4" /> Startup jasa lokal Kota Padang
            </div>
            <h1 className="mt-5 max-w-2xl text-[40px] font-black leading-[0.98] tracking-tight md:text-6xl">
              Pesan jasa harian dalam 1 menit.
            </h1>
            <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-white/82 md:text-lg">
              SERJAFAN membantu Anda mendapatkan layanan profesional untuk rumah, perbaikan, kebersihan, dan kebutuhan harian lain. Customer cukup pesan, lalu tim SERJAFAN menghubungi Anda dan menugaskan teknisi lapangan.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/customer" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#ffd54a] px-6 text-sm font-black text-slate-950 shadow-[0_14px_28px_rgba(255,213,74,0.28)] transition hover:-translate-y-0.5">
                Pesan Jasa Dalam 1 Menit <ChevronRight className="h-4 w-4" />
              </Link>
              <Link href="/support" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 text-sm font-black text-white transition hover:bg-white/15">
                Hubungi Admin
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[440px] md:pt-10">
            <div className="absolute -right-8 top-2 h-28 w-28 rounded-full bg-[#ffd54a]/30 blur-3xl" />
            <div className="relative rounded-[32px] border border-white/18 bg-white/12 p-3 shadow-[0_26px_70px_rgba(0,0,0,0.28)] backdrop-blur">
              <div className="overflow-hidden rounded-[26px] bg-[#f5f7fb] text-slate-950">
                <div className="bg-gradient-to-br from-[#0d47d9] to-[#003cb5] p-4 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black">SERJAFAN</span>
                    <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-bold">Padang</span>
                  </div>
                  <div className="mt-4 rounded-[18px] bg-white px-4 py-3 text-sm font-semibold text-slate-400">
                    Cari layanan yang Anda butuhkan...
                  </div>
                  <div className="mt-4 grid grid-cols-[1fr_120px] overflow-hidden rounded-[20px] bg-[#0f5bff]">
                    <div className="p-4">
                      <p className="text-2xl font-black">Semua Jasa</p>
                      <p className="mt-1 text-lg font-black text-[#ffd54a]">Dalam Satu Aplikasi</p>
                      <p className="mt-2 text-xs font-bold text-white/80">Cepat - Mudah - Terpercaya</p>
                    </div>
                    <img src="/rumah-gadang-padang.svg" alt="Rumah Gadang Padang" className="h-full w-full object-cover" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 p-4">
                  {landingServices.slice(0, 8).map((service) => {
                    const Icon = service.icon;
                    return (
                      <div key={service.name} className="text-center">
                        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#0d47d9]">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="mt-2 block truncate text-[10px] font-black">{customerCategoryLabel(service.name)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 pb-4">
                  <div className="rounded-[18px] bg-white p-3 shadow-soft">
                    <div className="flex items-center gap-3">
                      <img src="/service-ac.svg" alt="Service AC Padang" className="h-16 w-20 rounded-[14px] object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black">Service AC Padang</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">Preview order, chat & tracking</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">App</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                  {[
                    ["Order", "Customer"],
                    ["Status", "Teknisi"],
                    ["Maps", "Tracking"],
                    ["Panel", "Admin"]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[14px] bg-white p-3 shadow-sm">
                      <p className="text-sm font-black text-[#0d47d9]">{value}</p>
                      <p className="mt-1 text-[10px] font-bold text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 left-2 right-2 grid grid-cols-3 gap-2">
              {[
                ["Customer", "Pesan"],
                ["Teknisi", "Tugas"],
                ["Admin", "Pantau"]
              ].map(([title, label]) => (
                <div key={title} className="rounded-[16px] border border-white/18 bg-white/90 p-2 text-center text-slate-950 shadow-[0_10px_25px_rgba(15,23,42,0.16)] backdrop-blur">
                  <p className="text-[10px] font-black">{title}</p>
                  <p className="mt-0.5 text-[10px] font-bold text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 pb-8 sm:grid-cols-4 md:px-6">
          {landingStats.map((item) => (
            <div key={item.label} className="rounded-[20px] border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-2xl font-black">{item.value}</p>
              <p className="mt-1 text-[11px] font-bold leading-4 text-white/70">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <section className="rounded-[28px] bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0d47d9]">Preview aplikasi</p>
            <h2 className="mt-1 text-2xl font-black">SERJAFAN adalah perusahaan layanan dengan sistem operasional sendiri.</h2>
            </div>
            <Link href="/customer" className="inline-flex h-10 items-center justify-center rounded-full bg-[#ffd54a] px-4 text-sm font-black text-slate-950">Coba Customer</Link>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {dashboardScreens.map((screen) => (
              <DashboardPreviewCard key={screen.title} {...screen} />
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[28px] bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0d47d9]">Trust builder</p>
                <h2 className="mt-1 text-2xl font-black">Bukti nyata yang akan menaikkan kepercayaan.</h2>
              </div>
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">
                <AlertCircle className="h-4 w-4" /> Jangan pakai angka palsu
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {trustAssets.map(({ title, body, Icon }) => (
                <div key={title} className="rounded-[20px] border border-slate-100 bg-[#f8fbff] p-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-white text-[#0d47d9] shadow-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 text-sm font-black">{title}</h3>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-[#071f5c] p-5 text-white shadow-[0_16px_34px_rgba(15,23,42,0.12)]">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#ffd54a]">Target pilot 30 hari</p>
            <h2 className="mt-2 text-2xl font-black leading-tight">Fokus transaksi nyata, bukan sekadar visitor.</h2>
            <div className="mt-5 space-y-3">
              {pilotMilestones.map(([week, body]) => (
                <div key={week} className="rounded-[18px] bg-white/10 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#ffd54a]">{week}</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-white/86">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-3">
          {valueProps.map(({ Icon, title, body }) => (
            <div key={title} className="rounded-[24px] bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
              <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#eef4ff] text-[#0d47d9]">
                <Icon className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-base font-black">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-[28px] bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0d47d9]">Kategori utama</p>
              <h2 className="mt-1 text-2xl font-black">Jasa yang paling sering dicari di Padang</h2>
            </div>
            <Link href="/customer" className="hidden rounded-full bg-[#eef4ff] px-4 py-2 text-sm font-black text-[#0d47d9] sm:inline-flex">Lihat Semua</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 min-[520px]:grid-cols-4">
            {landingServices.map((service) => {
              const Icon = service.icon;
              return (
                <Link key={service.name} href="/customer" className="group flex items-center gap-3 rounded-[18px] bg-[#f7faff] p-3 transition hover:-translate-y-0.5 hover:bg-[#eef4ff]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0d47d9] shadow-sm">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-black">{customerCategoryLabel(service.name)}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[28px] bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0d47d9]">Cara kerja</p>
            <h2 className="mt-1 text-2xl font-black">Dari pesan sampai selesai, alurnya jelas.</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-5">
            {steps.map((step, index) => (
              <div key={step} className="relative rounded-[18px] border border-slate-100 bg-slate-50 p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0d47d9] text-xs font-black text-white">{index + 1}</span>
                <p className="mt-3 text-sm font-black leading-5">{step}</p>
                {index < steps.length - 1 && <span className="absolute -right-2 top-8 hidden h-0.5 w-4 bg-[#0d47d9]/30 sm:block" />}
              </div>
            ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-[#071f5c] p-5 text-white shadow-[0_16px_34px_rgba(15,23,42,0.12)]">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#ffd54a]">Fokus awal</p>
            <h2 className="mt-2 text-2xl font-black">Mulai dari layanan yang paling dibutuhkan.</h2>
            <div className="mt-5 space-y-3">
              {["Tukang Kunci Padang", "Service AC Padang", "Cleaning Service Padang"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-[18px] bg-white/10 p-3">
                  <Check className="h-5 w-5 text-[#ffd54a]" />
                  <span className="text-sm font-black">{item}</span>
                </div>
              ))}
            </div>
            <Link href="/customer" className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#ffd54a] px-5 text-sm font-black text-slate-950">
              Coba Pesan Sekarang
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0d47d9]">Bukti produk</p>
              <h2 className="mt-1 text-2xl font-black">Yang bisa dicek sekarang sebelum traction pilot masuk.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Statistik pelanggan dan order akan ditampilkan setelah pilot nyata berjalan. Saat ini yang ditampilkan adalah bukti sistem yang sudah tersedia.
              </p>
            </div>
            <div className="hidden items-center gap-1 rounded-full bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700 sm:flex">
              <ShieldCheck className="h-4 w-4" /> Produk berjalan
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {proofCards.map((item) => {
              const Icon = item.Icon;
              return (
              <div key={item.title} className="rounded-[20px] border border-slate-100 bg-[#f8fbff] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn("flex h-11 w-11 items-center justify-center rounded-full text-sm font-black", item.tone)}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-black">{item.title}</p>
                      <p className="text-xs font-bold text-slate-500">{item.label}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-black text-[#0d47d9]">
                    Siap
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.body}</p>
              </div>
              );
            })}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0d47d9]">Aplikasi SERJAFAN</p>
            <h2 className="mt-1 text-2xl font-black">Untuk V1, customer dan admin operasional dibuat paling kuat dulu.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Customer hanya berhubungan dengan SERJAFAN. Tim admin menerima order, menghubungi customer, lalu menugaskan teknisi lapangan secara operasional.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
          {apps.map(({ href, title, description, Icon, tone, actions }) => (
            <div key={href} className="rounded-[20px] border border-slate-100 bg-white p-4 shadow-soft transition hover:-translate-y-0.5">
              <span className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-[14px]", tone)}>
                <Icon className="h-6 w-6" />
              </span>
              <h2 className="text-base font-extrabold">{title}</h2>
              <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
              <div className="mt-4 grid gap-2">
                {actions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={cn(
                      "inline-flex h-10 items-center justify-center gap-1 rounded-[12px] text-xs font-extrabold",
                      action.primary ? "bg-navy text-white" : "border border-slate-200 text-navy"
                    )}
                  >
                    {action.label} <ChevronRight className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1fr]">
          <div className="rounded-[28px] bg-gradient-to-br from-[#0d47d9] to-[#003cb5] p-5 text-white shadow-[0_16px_34px_rgba(13,71,217,0.18)]">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#ffd54a]">Call to action</p>
            <h2 className="mt-2 text-3xl font-black leading-tight">Siap bikin pemesanan pertama lebih meyakinkan?</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/78">Mulai dari layanan utama, terima order dari customer, hubungi customer lewat admin, lalu tim SERJAFAN menugaskan teknisi lapangan yang sesuai.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/customer" className="inline-flex h-11 items-center justify-center rounded-full bg-[#ffd54a] px-5 text-sm font-black text-slate-950">Mulai Pesan</Link>
              <Link href="/support" className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 text-sm font-black text-white">Chat Admin</Link>
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0d47d9]">FAQ</p>
            <h2 className="mt-1 text-2xl font-black">Pertanyaan umum</h2>
            <div className="mt-4 space-y-3">
              {faqs.map((item) => (
                <details key={item.q} className="group rounded-[18px] bg-[#f8fbff] p-4">
                  <summary className="cursor-pointer list-none text-sm font-black text-slate-950">{item.q}</summary>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0d47d9]">SEO lokal</p>
          <h2 className="mt-1 text-2xl font-black">Halaman layanan untuk pencarian Google</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Dibuat khusus untuk keyword jasa lokal di Padang agar SERJAFAN lebih mudah ditemukan.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {seoLinks.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-full bg-[#eef4ff] px-4 py-2 text-sm font-black text-[#0d47d9]">
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs font-semibold text-slate-500">
          <Link href="/terms" className="hover:text-flame">
            Syarat
          </Link>
          <Link href="/privacy" className="hover:text-flame">
            Privasi
          </Link>
          <Link href="/refund" className="hover:text-flame">
            Refund
          </Link>
          <Link href="/support" className="hover:text-flame">
            Bantuan
          </Link>
        </div>
      </div>
    </main>
  );
}

function DashboardPreviewCard({
  title,
  subtitle,
  Icon,
  tone,
  metrics,
  rows
}: {
  title: string;
  subtitle: string;
  Icon: React.ElementType;
  tone: string;
  metrics: string[][];
  rows: string[];
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-100 bg-[#f8fbff] shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <div className={cn("bg-gradient-to-br p-4 text-white", tone)}>
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-white/16">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-base font-black">{title}</h3>
              <p className="truncate text-xs font-bold text-white/70">{subtitle}</p>
            </div>
          </div>
          <span className="rounded-full bg-white/16 px-2.5 py-1 text-[10px] font-black">Live UI</span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {metrics.map(([label, value]) => (
            <div key={label} className="rounded-[14px] bg-white/14 p-2">
              <p className="text-[10px] font-bold text-white/65">{label}</p>
              <p className="mt-1 truncate text-xs font-black">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4">
        <div className="rounded-[18px] bg-white p-3 shadow-sm">
          {rows.map((row, index) => (
            <div key={row} className={cn("flex items-center gap-3 py-2", index > 0 && "border-t border-slate-100")}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#0d47d9]">
                <Check className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-extrabold leading-5 text-slate-700">{row}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-[16px] bg-[#eef4ff] px-3 py-2">
          <span className="text-[11px] font-black text-[#0d47d9]">Terhubung API</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
        </div>
      </div>
    </div>
  );
}

export function SerjafanApp({ appRole = "switcher" }: { appRole?: AppRole }) {
  const requiredRole = appRole === "partner" ? "PARTNER" : appRole === "admin" ? "ADMIN" : null;
  const [authSession, setAuthSession] = useState<StoredSession | null>(null);
  const [authReady, setAuthReady] = useState(appRole === "switcher");
  const [screen, setScreen] = useState<Screen>(initialScreenByRole[appRole]);
  const [accountUser, setAccountUser] = useState<CurrentUser>(() => {
    const storedProfile = appRole === "customer" ? getStoredCustomerProfile() : null;
    return storedProfile ? { ...currentUser, ...storedProfile, walletBalance: currentUser.walletBalance } : currentUser;
  });
  const [customerAccessReady, setCustomerAccessReady] = useState(() => appRole !== "customer" || isCustomerProfileReady(appRole === "customer" ? getStoredCustomerProfile() ?? currentUser : currentUser));
  const [currentPartner, setCurrentPartner] = useState<Partner>(emptyPartner);
  const [orderDraft, setOrderDraft] = useState<OrderDraft>(initialDraft);
  const [lastOrder, setLastOrder] = useState<LastOrder | null>(null);
  const [partnerOnline, setPartnerOnline] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ kind: ToastKind; message: string } | null>(null);
  const [drawer, setDrawer] = useState<null | "notifications" | "messages" | "phone" | "search" | "profile" | "notificationSettings">(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [messages, setMessages] = useState<MessageThread[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    soundEnabled: true,
    vibrationEnabled: true,
    soundTone: "classic",
    customRingtoneName: null,
    customRingtoneData: null
  });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerServices, setCustomerServices] = useState<ServiceItem[]>(services);
  const [customerPartners, setCustomerPartners] = useState<Partner[]>([]);
  const [customerPromos, setCustomerPromos] = useState<PromoBanner[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [partnerOrders, setPartnerOrders] = useState<any[]>([]);
  const [partnerWalletBalance, setPartnerWalletBalance] = useState(0);
  const [partnerWalletTransactions, setPartnerWalletTransactions] = useState<WalletTransaction[]>([]);
  const [partnerProfile, setPartnerProfile] = useState<any | null>(null);
  const [adminLiveOrders, setAdminLiveOrders] = useState<any[]>([]);
  const [adminMapData, setAdminMapData] = useState<AdminMapData>({ pairs: [], summary: { monitoredOrders: 0, monitoredCustomers: 0, monitoredPartners: 0 } });
  const [adminConsole, setAdminConsole] = useState<AdminConsoleData>(initialAdminConsole);
  const [adminWalletData, setAdminWalletData] = useState<AdminWalletData>(initialAdminWalletData);
  const [adminAuditData, setAdminAuditData] = useState<AdminAuditData>(initialAdminAuditData);
  const [pendingPartners, setPendingPartners] = useState<any[]>([]);
  const [adminDashboard, setAdminDashboard] = useState<{ revenueMonth: number; totalOrders: number; activePartners: number; activeCustomers: number } | null>(null);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(initialAdminSettings);
  const [loadingPanel, setLoadingPanel] = useState<"notifications" | "messages" | "orders" | "partnerOrders" | "admin" | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const knownNotificationIds = useRef<Set<string>>(new Set());
  const knownMessageIds = useRef<Set<string>>(new Set());
  const alertReady = useRef(false);

  useEffect(() => {
    if (appRole === "customer") {
      const existing = getStoredSession("CUSTOMER");
      if (existing) {
        setAuthSession(existing);
        setAuthReady(true);
        return;
      }

      const deviceId = getOrCreateDeviceId();
      fetch("/api/customer/guest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ deviceId })
      })
        .then(async (response) => {
          const payload = (await parseJsonResponse(response)) as CustomerGuestResponse;
          if (!response.ok || !payload.data?.session) throw new Error(payload.error?.message ?? "Akses customer gagal dibuat.");
          window.localStorage.setItem("serjafan-customer-device", payload.data.deviceId);
          storeSession(payload.data.session);
          setAuthSession(payload.data.session);
        })
        .catch(() => {
          notify("error", "Gagal menyiapkan akses customer. Periksa koneksi lalu refresh.");
        })
        .finally(() => setAuthReady(true));
      return;
    }

    if (!requiredRole) return;
    setAuthSession(getStoredSession(requiredRole));
    setAuthReady(true);
  }, [appRole, requiredRole]);

  const customerProfileComplete = appRole !== "customer" || customerAccessReady || isCustomerProfileReady(accountUser);
  const showRoleTabs = appRole === "switcher";
  const showAppHeader = appRole !== "customer";
  const showBottomNav = useMemo(
    () => customerProfileComplete && (appRole === "customer" || (appRole === "switcher" && !["partner", "admin"].includes(screen))),
    [appRole, customerProfileComplete, screen]
  );
  const activeRoleTab = screen === "partner" || screen === "admin" ? screen : "home";
  const role: "CUSTOMER" | "PARTNER" | "ADMIN" =
    screen === "partner" ? "PARTNER" : screen === "admin" ? "ADMIN" : "CUSTOMER";
  const isAuthorized = appRole === "customer" ? authSession?.role === "CUSTOMER" : !requiredRole || authSession?.role === requiredRole;
  const goTo = (next: Screen) => {
    if (appRole === "customer" && (next === "partner" || next === "admin")) return;
    if (appRole === "partner" && !["partner", "partnerAccount", "partnerTopup", "tracking"].includes(next)) return;
    if (appRole === "admin" && next !== "admin") return;
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const notify = (kind: ToastKind, message: string) => {
    setToast({ kind, message });
    window.setTimeout(() => setToast(null), 3200);
  };

  const logoutCurrentUser = () => {
    clearStoredSession(role);
    setAuthSession(null);
    setAccountUser(currentUser);
    setCustomerOrders([]);
    setWalletTransactions([]);
    setMessages([]);
    setNotifications([]);
    setScreen(initialScreenByRole[appRole]);
    notify("success", "Akun berhasil keluar dari perangkat ini.");
  };

  const handleAuthFailure = (error: unknown, roleToClear = role) => {
    if (!(error instanceof ApiRequestError)) return false;
    const shouldResetSession = [401, 403].includes(error.status) || (appRole === "partner" && roleToClear === "PARTNER" && error.status === 404);
    if (!shouldResetSession) return false;
    clearStoredSession(roleToClear);
    setAuthSession(null);
    setAuthReady(true);
    if (appRole === "partner") {
      setScreen("partner");
      setPartnerProfile(null);
      setPartnerOrders([]);
      setPartnerWalletBalance(0);
      setPartnerWalletTransactions([]);
    }
    notify("error", "Sesi akun sudah tidak aktif. Silakan login atau daftar akun lagi.");
    return true;
  };

  const playBell = (tone: NotificationPreferences["soundTone"] = notificationPreferences.soundTone, sourcePreferences: NotificationPreferences = notificationPreferences) => {
    if (!sourcePreferences.soundEnabled) return;
    try {
      if (tone === "custom" && sourcePreferences.customRingtoneData) {
        const audio = new Audio(sourcePreferences.customRingtoneData);
        audio.volume = 0.85;
        void audio.play();
        return;
      }
      const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;
      const context = new AudioContextCtor();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      const startFrequency = tone === "urgent" ? 980 : tone === "soft" ? 620 : 880;
      const endFrequency = tone === "urgent" ? 1760 : tone === "soft" ? 880 : 1320;
      oscillator.frequency.setValueAtTime(startFrequency, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, context.currentTime + 0.12);
      gain.gain.setValueAtTime(0.001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(tone === "soft" ? 0.08 : 0.16, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.32);
      window.setTimeout(() => void context.close(), 420);
    } catch {
      // Audio is best-effort because some browsers block sound before interaction.
    }
  };

  const vibrateDevice = (pattern: number | number[] = [160, 80, 160]) => {
    if (!notificationPreferences.vibrationEnabled) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const playIncomingAlert = (kind: "notification" | "message" | "phone" = "notification") => {
    const tone = kind === "phone" ? "urgent" : notificationPreferences.soundTone;
    playBell(tone);
    vibrateDevice(kind === "phone" ? [260, 120, 260, 120, 260] : kind === "message" ? [120, 60, 120] : [180, 90, 180]);
  };

  const showSystemNotification = (title: string, body: string, kind: "notification" | "message" | "phone" = "notification") => {
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
    try {
      navigator.serviceWorker?.getRegistration?.().then((registration) => {
        const options = {
          body,
          icon: "/serjafan-logo.png",
          badge: "/serjafan-logo.png",
          tag: `serjafan-${kind}`,
          vibrate: notificationPreferences.vibrationEnabled ? [180, 90, 180] : undefined
        };
        if (registration) {
          void registration.showNotification(title, options);
        } else {
          new Notification(title, options);
        }
      });
    } catch {
      // Browser notification support is best-effort.
    }
  };

  const registerPushSubscription = async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      notify("error", "Browser ini belum mendukung Web Push.");
      return false;
    }
    const keyResponse = await fetch("/api/push/public-key", { cache: "no-store" });
    const keyPayload = (await parseJsonResponse(keyResponse)) as { data?: { publicKey?: string }; error?: { message?: string } };
    if (!keyResponse.ok || !keyPayload.data?.publicKey) {
      throw new Error(keyPayload.error?.message ?? "Public key push belum siap.");
    }
    const registration = await navigator.serviceWorker.register("/sw.js");
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyPayload.data.publicKey)
      }));
    const response = await apiFetch("/api/push/subscribe", role, {
      method: "POST",
      body: JSON.stringify(subscription)
    });
    const payload = (await parseJsonResponse(response)) as { error?: { message?: string } };
    if (!response.ok) throw new Error(payload.error?.message ?? "Subscription push gagal disimpan.");
    return true;
  };

  const requestBrowserNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      notify("error", "Browser ini belum mendukung notifikasi layar.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        await registerPushSubscription();
        showSystemNotification("SERJAFAN aktif", "Notifikasi layar HP sudah diizinkan.", "notification");
        notify("success", "Notifikasi layar HP aktif.");
      } else {
        notify("error", "Izin notifikasi belum aktif. Aktifkan dari pengaturan browser jika tertolak.");
      }
    } catch {
      notify("error", "Gagal meminta izin notifikasi browser.");
    }
  };

  const loadNotificationPreferences = async () => {
    try {
      const data = await readApi<{ preferences: NotificationPreferences }>("/api/me/notification-preferences", role);
      setNotificationPreferences(data.data.preferences);
    } catch {
      // Keep local defaults if the server is temporarily unavailable.
    }
  };

  const saveNotificationPreferences = async (preferences: NotificationPreferences) => {
    const previous = notificationPreferences;
    setNotificationPreferences(preferences);
    try {
      const response = await apiFetch("/api/me/notification-preferences", role, {
        method: "PUT",
        body: JSON.stringify(preferences)
      });
      const payload = (await parseJsonResponse(response)) as { data?: { preferences?: NotificationPreferences }; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "Pengaturan notifikasi gagal disimpan.");
      if (payload.data?.preferences) setNotificationPreferences(payload.data.preferences);
      notify("success", "Pengaturan notifikasi tersimpan.");
    } catch (error) {
      setNotificationPreferences(previous);
      notify("error", error instanceof Error ? error.message : "Pengaturan notifikasi gagal disimpan.");
    }
  };

  const loadRealtimeAlerts = async (activeRole: "CUSTOMER" | "PARTNER" | "ADMIN", silent = true) => {
    try {
      const [notificationData, messageData] = await Promise.all([
        readApi<{ notifications: NotificationItem[] }>("/api/notifications", activeRole),
        readApi<{ threads: MessageThread[] }>("/api/messages", activeRole)
      ]);
      const nextNotifications = notificationData.data.notifications;
      const nextMessages = messageData.data.threads;
      const hasNewNotification = nextNotifications.some((item) => !knownNotificationIds.current.has(item.id));
      const hasNewMessage = nextMessages.some((item) => item.unread && !knownMessageIds.current.has(item.id));
      const latestMessage = nextMessages.find((item) => item.unread && !knownMessageIds.current.has(item.id));
      const latestNotification = nextNotifications.find((item) => !knownNotificationIds.current.has(item.id));
      setNotifications(nextNotifications);
      setMessages(nextMessages);
      knownNotificationIds.current = new Set(nextNotifications.map((item) => item.id));
      knownMessageIds.current = new Set(nextMessages.map((item) => item.id));
      if (alertReady.current && (hasNewNotification || hasNewMessage)) {
        playIncomingAlert(hasNewMessage ? "message" : "notification");
        const source = latestMessage ?? latestNotification;
        if (source) showSystemNotification(source.title, source.body, hasNewMessage ? "message" : "notification");
      }
      alertReady.current = true;
    } catch {
      if (!silent) notify("error", "Gagal memuat notifikasi dan pesan.");
    }
  };

  const loadAccount = async (silent = true) => {
    if (appRole !== "customer" && screen !== "home" && screen !== "profile" && screen !== "wallet") return;
    try {
      const [me, wallet] = await Promise.all([
        readApi<{ user: CurrentUser & { email?: string } }>("/api/me", "CUSTOMER"),
        readApi<{ wallet: { balance: number } }>("/api/wallet", "CUSTOMER")
      ]);
      setAccountUser((prev) => ({
        ...prev,
        id: me.data.user.id || prev.id,
        name: me.data.user.name || prev.name,
        location: me.data.user.location || prev.location,
        phone: me.data.user.phone || prev.phone,
        image: me.data.user.image ?? prev.image ?? null,
        walletBalance: wallet.data.wallet.balance
      }));
      if (isCustomerProfileReady(me.data.user)) {
        storeCustomerProfile({
          id: me.data.user.id,
          name: me.data.user.name,
          phone: me.data.user.phone,
          location: me.data.user.location,
          image: me.data.user.image ?? null
        });
        setCustomerAccessReady(true);
      }
      if (me.data.user.location && me.data.user.phone) {
        setOrderDraft((draft) => ({
          ...draft,
          address: draft.address || me.data.user.location,
          addressNote: draft.addressNote === initialDraft.addressNote ? `Nomor HP customer: ${me.data.user.phone}` : draft.addressNote
        }));
      }
    } catch {
      if (!silent) notify("error", "Gagal memuat akun dan dompet.");
    }
  };

  const openNotifications = async () => {
    setDrawer("notifications");
    playIncomingAlert("notification");
    setLoadingPanel("notifications");
    try {
      const data = await readApi<{ notifications: NotificationItem[] }>("/api/notifications", role);
      setNotifications(data.data.notifications);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingPanel(null);
    }
  };

  const openMessages = async () => {
    setDrawer("messages");
    playIncomingAlert("message");
    setLoadingPanel("messages");
    try {
      const data = await readApi<{ threads: MessageThread[] }>("/api/messages", role);
      setMessages(data.data.threads);
    } catch {
      setMessages([]);
    } finally {
      setLoadingPanel(null);
    }
  };

  const openPhone = () => {
    playIncomingAlert("phone");
    setDrawer("phone");
  };

  const sendMessage = async (body: string, attachmentImage?: string, orderId?: string | null) => {
    try {
      const response = await apiFetch("/api/messages", role, {
        method: "POST",
        body: JSON.stringify({
          body,
          attachmentImage,
          orderId: orderId ?? lastOrder?.id ?? selectedOrder?.id,
          recipientRole: role === "CUSTOMER" ? "PARTNER" : "CUSTOMER"
        })
      });
      const payload = (await parseJsonResponse(response)) as { error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "message failed");
      notify("success", "Pesan terkirim.");
      await openMessages();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Gagal mengirim pesan.");
    }
  };

  const openSearch = () => {
    setSearchQuery("");
    goTo("search");
  };

  const openProfile = () => {
    goTo("profile");
  };

  const openPartnerList = (category?: string) => {
    if (!customerProfileComplete) {
      notify("error", "Lengkapi nama, nomor HP, dan alamat lengkap dulu.");
      return;
    }
    setSelectedCategory(category && category !== "Lainnya" ? category : null);
    goTo("partnerList");
  };

  const openWalletHistory = async () => {
    setScreen("walletHistory");
    try {
      const data = await readApi<{ transactions: WalletTransaction[] }>("/api/wallet/transactions", "CUSTOMER");
      setWalletTransactions(data.data.transactions);
      await loadAccount(true);
    } catch {
      notify("error", "Gagal memuat riwayat dompet.");
    }
  };

  const submitTopUp = async (amount: number, method: string, meta?: ManualTopUpMeta) => {
    try {
      const response = await apiFetch("/api/payments/topup", "CUSTOMER", {
        method: "POST",
        body: JSON.stringify({ amount, channel: paymentChannelFromLabel(method), senderName: meta?.senderName, reference: meta?.reference, proofImage: meta?.proofImage })
      });
      const payload = (await parseJsonResponse(response)) as { data?: { payment?: { provider?: string; checkoutUrl?: string | null; instructions?: { bankName?: string; bankAccount?: string; bankHolder?: string; danaNumber?: string; qrisName?: string } } }; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "Top Up gagal dibuat.");
      notify("success", "Top up manual dibuat. Transfer ke rekening/DANA admin, upload bukti, lalu tunggu admin verifikasi.");
      if (payload.data?.payment?.checkoutUrl) window.open(payload.data.payment.checkoutUrl, "_blank", "noopener,noreferrer");
      goTo("wallet");
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Top Up gagal dibuat.");
    }
  };

  const submitProfile = async (profile: { name: string; phone: string; location: string; profilePhoto?: string | null }) => {
    try {
      const firstCustomerSetup = appRole === "customer" && !customerProfileComplete;
      if (firstCustomerSetup) {
        const access = await saveCustomerAccessProfile(profile);
        if (!access) throw new Error("Akses customer gagal disimpan.");
        const nextUser = {
          id: access.user?.id || access.session.userId || accountUser.id,
          name: access.user?.name ?? profile.name,
          phone: access.user?.phone ?? profile.phone,
          location: access.user?.location ?? profile.location,
          image: access.user?.image ?? profile.profilePhoto ?? accountUser.image,
          walletBalance: accountUser.walletBalance
        };
        setAuthSession(access.session);
        setAccountUser((user) => ({ ...user, ...nextUser }));
        storeCustomerProfile(nextUser);
        setCustomerAccessReady(true);
        setOrderDraft((draft) => ({
          ...draft,
          address: profile.location,
          addressNote: `Nomor HP customer: ${profile.phone}`
        }));
        notify("success", "Data customer tersimpan. Membuka beranda customer...");
        goTo("home");
        return;
      }

      if (appRole === "customer") {
        const session = await ensureCustomerGuestSession();
        if (session) setAuthSession(session);
      }

      let response = await apiFetch("/api/me", "CUSTOMER", {
        method: "PUT",
        body: JSON.stringify(profile)
      });
      if (appRole === "customer" && response.status === 401) {
        clearStoredSession("CUSTOMER");
        const session = await ensureCustomerGuestSession();
        if (session) setAuthSession(session);
        response = await apiFetch("/api/me", "CUSTOMER", {
          method: "PUT",
          body: JSON.stringify(profile)
        });
      }
      const payload = (await parseJsonResponse(response)) as { data?: { user?: CurrentUser }; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "Profil gagal diperbarui.");
      setAccountUser((user) => ({
        ...user,
        name: profile.name,
        phone: profile.phone,
        location: profile.location,
        image: profile.profilePhoto === undefined ? user.image : profile.profilePhoto
      }));
      storeCustomerProfile({
        name: profile.name,
        phone: profile.phone,
        location: profile.location,
        image: profile.profilePhoto
      });
      if (isCustomerProfileReady(profile)) setCustomerAccessReady(true);
      setOrderDraft((draft) => ({
        ...draft,
        address: profile.location,
        addressNote: `Nomor HP customer: ${profile.phone}`
      }));
      notify("success", "Profil berhasil diperbarui dan tersimpan di akun.");
      goTo(firstCustomerSetup ? "home" : "profile");
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Profil gagal diperbarui.");
    }
  };

  const loadSettings = async () => {
    try {
      const data = await readApi<{ settings: AdminSettings }>(appRole === "admin" ? "/api/admin/settings" : "/api/settings", appRole === "admin" ? "ADMIN" : "CUSTOMER");
      const settings = { ...initialAdminSettings, ...data.data.settings };
      setAdminSettings(settings);
      setOrderDraft((draft) => ({
        ...draft,
        platformFee: settings.platformFee,
        promoCode: draft.promoCode || settings.promoCode
      }));
      return settings;
    } catch {
      setAdminSettings(initialAdminSettings);
      return initialAdminSettings;
    }
  };

  const loadCustomerServices = async (silent = true) => {
    try {
      const response = await fetch("/api/services/categories", { cache: "no-store" });
      if (!response.ok) throw new Error("services failed");
      const payload = (await parseJsonResponse(response)) as {
        data: {
          categories: Array<{ id?: string; name: string; icon?: string; basePrice?: number; description?: string }>;
        };
      };
      const seen = new Set<string>();
      const mapped = payload.data.categories
        .filter((category) => {
          const key = category.name.trim().toLowerCase();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((category, index) => ({
          id: category.id,
          name: category.name,
          icon: serviceIconByName(category.name),
          tone: serviceToneByIndex(index),
          basePrice: category.basePrice,
          description: category.description
        }));

      setCustomerServices(mapped.length ? mapped : services);
    } catch {
      setCustomerServices(services);
    }
  };

  const loadCustomerPartners = async (silent = true) => {
    try {
      const response = await fetch("/api/partners", { cache: "no-store" });
      if (!response.ok) throw new Error("partners failed");
      const payload = (await parseJsonResponse(response)) as {
        data: {
          partners: Array<{
            id: string;
            name: string;
            category: string;
            distanceKm: number;
            rating: number;
            reviewCount: number;
            completedOrders: number;
            etaMinutes: number;
            priceFrom: number;
            contactPhone?: string | null;
            paymentBankName?: string | null;
            paymentBankAccount?: string | null;
            paymentBankHolder?: string | null;
            paymentDanaNumber?: string | null;
            paymentDanaName?: string | null;
            acceptsCash?: boolean | null;
            status: "ONLINE" | "BUSY" | "OFFLINE";
          }>;
        };
      };

      setCustomerPartners(
        payload.data.partners.map((partner, index) => ({
          id: partner.id,
          name: partner.name,
          category: partner.category,
          distance: `${partner.distanceKm} km`,
          rating: partner.rating.toFixed(1),
          reviews: String(partner.reviewCount),
          orders: `${partner.completedOrders}+`,
          eta: `~${partner.etaMinutes} min`,
          status: partner.status === "ONLINE" ? "Online" : "Sibuk",
          priceFrom: partner.priceFrom,
          phone: partner.contactPhone ?? null,
          paymentBankName: partner.paymentBankName ?? null,
          paymentBankAccount: partner.paymentBankAccount ?? null,
          paymentBankHolder: partner.paymentBankHolder ?? null,
          paymentDanaNumber: partner.paymentDanaNumber ?? null,
          paymentDanaName: partner.paymentDanaName ?? null,
          acceptsCash: partner.acceptsCash ?? true,
          tone: serviceToneByIndex(index),
          Icon: serviceIconByName(partner.category)
        }))
      );
    } catch {
      setCustomerPartners([]);
    }
  };

  const loadCustomerPromos = async () => {
    try {
      const response = await fetch("/api/services/promos", { cache: "no-store" });
      if (!response.ok) throw new Error("promos failed");
      const payload = (await parseJsonResponse(response)) as { data?: { promos?: PromoBanner[] } };
      const promos = (payload.data?.promos ?? [])
        .filter((promo) => promo.active !== false)
        .map((promo) => ({
          code: promo.code,
          title: promo.title || promo.note || `Promo ${promo.code}`,
          description: promo.description || promo.note || "Promo aktif dari admin SERJAFAN.",
          note: promo.note,
          discount: Number(promo.discount || 0),
          mediaUrl: promo.mediaUrl ?? null,
          mediaType: promo.mediaType ?? null
        }));
      setCustomerPromos(promos);
    } catch {
      setCustomerPromos([]);
    }
  };

  const loadCustomerOrders = async (silent = false) => {
    if (!silent) setLoadingPanel("orders");
    try {
      const data = await readApi<{ orders: any[] }>("/api/orders", "CUSTOMER");
      setCustomerOrders(data.data.orders);
    } catch {
      setCustomerOrders([]);
    } finally {
      if (!silent) setLoadingPanel(null);
    }
  };

  const loadPartnerOrders = async (silent = false) => {
    if (!silent) setLoadingPanel("partnerOrders");
    try {
      const data = await readApi<{ orders: any[] }>("/api/partner/orders", "PARTNER");
      setPartnerOrders(data.data.orders);
    } catch (error) {
      if (handleAuthFailure(error, "PARTNER")) return;
      setPartnerOrders([]);
    } finally {
      if (!silent) setLoadingPanel(null);
    }
  };

  const loadPartnerWallet = async (silent = true) => {
    try {
      const [wallet, transactions] = await Promise.all([
        readApi<{ wallet: { balance: number } }>("/api/partner/wallet", "PARTNER"),
        readApi<{ transactions: WalletTransaction[] }>("/api/wallet/transactions", "PARTNER")
      ]);
      setPartnerWalletBalance(wallet.data.wallet.balance);
      setPartnerWalletTransactions(transactions.data.transactions);
    } catch (error) {
      if (handleAuthFailure(error, "PARTNER")) return;
      setPartnerWalletBalance(0);
      setPartnerWalletTransactions([]);
      if (!silent) notify("error", "Gagal memuat dompet partner.");
    }
  };

  const loadPartnerProfile = async (silent = true) => {
    try {
      const data = await readApi<{ partner: any }>("/api/partner/me", "PARTNER");
      setPartnerProfile(data.data.partner);
    } catch (error) {
      if (handleAuthFailure(error, "PARTNER")) return;
      setPartnerProfile(null);
      if (!silent) notify("error", "Gagal memuat profil partner.");
    }
  };

  const savePartnerPayments = async (payments: {
    paymentBankName: string;
    paymentBankAccount: string;
    paymentBankHolder: string;
    paymentDanaNumber: string;
    paymentDanaName: string;
    acceptsCash: boolean;
  }) => {
    try {
      const response = await apiFetch("/api/partner/me", "PARTNER", {
        method: "PUT",
        body: JSON.stringify(payments)
      });
      const payload = (await parseJsonResponse(response)) as { data?: { partner?: any }; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "Data pembayaran gagal disimpan.");
      setPartnerProfile(payload.data?.partner ?? null);
      notify("success", "Data pembayaran teknisi tersimpan dan dapat dipantau admin.");
      return true;
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Data pembayaran gagal disimpan.");
      return false;
    }
  };

  const submitPartnerTopUp = async (amount: number, method: string, meta?: ManualTopUpMeta) => {
    try {
      const response = await apiFetch("/api/payments/topup", "PARTNER", {
        method: "POST",
        body: JSON.stringify({ amount, channel: paymentChannelFromLabel(method), senderName: meta?.senderName, reference: meta?.reference, proofImage: meta?.proofImage })
      });
      const payload = (await parseJsonResponse(response)) as { data?: { payment?: { provider?: string; checkoutUrl?: string | null } }; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "Top Up partner gagal dibuat.");
      notify("success", payload.data?.payment?.provider === "manual" ? "Top up teknisi menunggu verifikasi admin. Saldo aktif setelah transfer disetujui." : "Invoice top up teknisi dibuat. Selesaikan pembayaran dulu.");
      if (payload.data?.payment?.checkoutUrl) window.open(payload.data.payment.checkoutUrl, "_blank", "noopener,noreferrer");
      goTo("partnerAccount");
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Top Up teknisi gagal dibuat.");
    }
  };

  const submitPartnerTransfer = async (target: string, amount: number, note: string) => {
    try {
      const response = await apiFetch("/api/wallet/transfer", "PARTNER", {
        method: "POST",
        body: JSON.stringify({ target, amount, note })
      });
      const payload = (await parseJsonResponse(response)) as { data?: { wallet?: { balance: number }; transaction?: WalletTransaction }; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "Transfer partner gagal.");
      setPartnerWalletBalance(payload.data?.wallet?.balance ?? Math.max(0, partnerWalletBalance - amount));
      if (payload.data?.transaction) setPartnerWalletTransactions((items) => [payload.data!.transaction!, ...items]);
      notify("success", "Transfer partner berhasil dan masuk riwayat.");
      goTo("partnerWallet");
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Transfer partner gagal.");
    }
  };

  const loadAdminData = async (silent = false) => {
    if (!silent) setLoadingPanel("admin");
    try {
      const dashboard = await readApi<{ revenueMonth: number; totalOrders: number; activePartners: number; activeCustomers: number }>("/api/admin/dashboard", "ADMIN");
      const liveOrders = await readApi<{ orders: any[] }>("/api/admin/orders/live", "ADMIN");
      const mapData = await readApi<AdminMapData>("/api/admin/maps", "ADMIN");
      const consoleData = await readApi<AdminConsoleData>("/api/admin/console", "ADMIN");
      const walletData = await readApi<AdminWalletData>("/api/admin/wallets", "ADMIN");
      const auditData = await readApi<AdminAuditData>("/api/admin/audit", "ADMIN");
      const pending = await readApi<{ partners: any[] }>("/api/admin/partners/pending-verification", "ADMIN");
      const settings = await readApi<{ settings: AdminSettings }>("/api/admin/settings", "ADMIN");
      setAdminDashboard(dashboard.data);
      setAdminLiveOrders(liveOrders.data.orders);
      setAdminMapData(mapData.data);
      setAdminConsole(consoleData.data);
      setAdminWalletData(walletData.data);
      setAdminAuditData(auditData.data);
      setPendingPartners(pending.data.partners);
      setAdminSettings(settings.data.settings);
    } catch {
      setAdminDashboard({ revenueMonth: 0, totalOrders: 0, activePartners: 0, activeCustomers: 0 });
      setAdminLiveOrders([]);
      setAdminMapData({ pairs: [], summary: { monitoredOrders: 0, monitoredCustomers: 0, monitoredPartners: 0 } });
      setAdminConsole(initialAdminConsole);
      setAdminWalletData(initialAdminWalletData);
      setAdminAuditData(initialAdminAuditData);
      setPendingPartners([]);
    } finally {
      if (!silent) setLoadingPanel(null);
    }
  };

  const adjustAdminWallet = async (payload: { userId?: string; amount?: number; description: string; action?: "ADJUST" | "APPROVE_TOPUP" | "REJECT_TOPUP"; paymentIntentId?: string }) => {
    try {
      const response = await apiFetch("/api/admin/wallets", "ADMIN", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const result = (await parseJsonResponse(response)) as { error?: { message?: string } };
      if (!response.ok) throw new Error(result.error?.message ?? "Gagal memproses wallet.");
      notify("success", payload.action === "APPROVE_TOPUP" ? "Top up disetujui dan saldo masuk." : payload.action === "REJECT_TOPUP" ? "Top up ditolak." : "Saldo akun berhasil disesuaikan oleh admin.");
      await loadAdminData(true);
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Gagal memproses wallet.");
    }
  };

  const updatePartnerOnline = async (online: boolean) => {
    if (online && partnerWalletBalance < 20000) {
      notify("error", "Top up deposit teknisi minimal Rp 20.000 dulu sebelum bisa menerima tugas SERJAFAN.");
      goTo("partnerTopup");
      return;
    }
    if (online && !hasPartnerDirectPayment(partnerProfile as Partial<Partner> | null)) {
      notify("error", "Isi minimal rekening bank lengkap atau akun DANA teknisi dulu sebelum menerima tugas SERJAFAN.");
      goTo("partnerAccount");
      return;
    }
    setPartnerOnline(online);
    try {
      const response = await apiFetch("/api/partner/status", "PARTNER", {
        method: "PUT",
        body: JSON.stringify({ status: online ? "ONLINE" : "OFFLINE" })
      });
      const payload = (await parseJsonResponse(response)) as { error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "status failed");
      notify("success", online ? "Status teknisi online." : "Status teknisi offline.");
    } catch {
      setPartnerOnline(!online);
      notify("error", "Gagal mengubah status teknisi. Pastikan deposit minimal Rp 20.000 aktif.");
    }
  };

  const updateOrderStatus = async (orderId: string, status: "ON_THE_WAY" | "IN_PROGRESS" | "COMPLETED") => {
    try {
      const response = await apiFetch(`/api/orders/${orderId}/status`, "PARTNER", {
        method: "POST",
        body: JSON.stringify({
          status,
          latitude: getPartnerMapPoint(orderDraft.partnerId).lat,
          longitude: getPartnerMapPoint(orderDraft.partnerId).lng
        })
      });
      const payload = (await parseJsonResponse(response)) as { error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "status failed");
      notify("success", `Status pesanan ${orderId} diperbarui.`);
      await loadPartnerOrders();
      await loadPartnerWallet(true);
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Gagal memperbarui status pesanan.");
    }
  };

  const submitPartnerReview = async (order: any, rating: number, comment: string) => {
    const partnerId = order.partnerId ?? order.partner?.id;
    if (!partnerId) {
      notify("error", "Partner pesanan tidak ditemukan.");
      return;
    }
    try {
      const response = await apiFetch(`/api/partners/${partnerId}/reviews`, "CUSTOMER", {
        method: "POST",
        body: JSON.stringify({ rating, comment })
      });
      const payload = (await parseJsonResponse(response)) as { error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "Ulasan gagal dikirim.");
      notify("success", "Terima kasih, rating dan ulasan berhasil dikirim.");
      await loadCustomerOrders(true);
      await loadCustomerPartners(true);
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Ulasan gagal dikirim.");
    }
  };

  const reviewPartner = async (partnerId: string, action: "approve" | "reject") => {
    try {
      const response = await apiFetch(`/api/admin/partners/${partnerId}/${action}`, "ADMIN", {
        method: "POST",
        body: action === "reject" ? JSON.stringify({ reason: "Dokumen belum lengkap" }) : undefined
      });
      if (!response.ok) throw new Error("review failed");
      notify("success", action === "approve" ? "Mitra disetujui." : "Mitra ditolak.");
      await loadAdminData();
    } catch {
      notify("error", "Gagal memproses verifikasi mitra.");
    }
  };

  const saveAdminSettings = async (settings: AdminSettings) => {
    try {
      const response = await apiFetch("/api/admin/settings", "ADMIN", {
        method: "PUT",
        body: JSON.stringify(settings)
      });
      const payload = (await parseJsonResponse(response)) as { data?: { settings: AdminSettings }; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "settings failed");
      setAdminSettings({ ...initialAdminSettings, ...payload.data!.settings });
      await loadSettings();
      notify("success", "Pengaturan admin tersimpan dan tersambung ke semua aplikasi.");
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Gagal menyimpan pengaturan admin.");
    }
  };

  const saveAdminConsole = async (settings: AdminConsoleData["settings"]) => {
    try {
      const response = await apiFetch("/api/admin/console", "ADMIN", {
        method: "PUT",
        body: JSON.stringify(settings)
      });
      const payload = (await parseJsonResponse(response)) as { data?: { settings: AdminConsoleData["settings"] }; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "console failed");
      setAdminConsole((current) => ({ ...current, settings: payload.data!.settings }));
      await loadAdminData(true);
      await loadSettings();
      await loadCustomerServices(true);
      await loadCustomerPartners(true);
      await loadCustomerPromos();
      notify("success", "Pusat kontrol admin tersimpan.");
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Gagal menyimpan pusat kontrol admin.");
    }
  };

  const updateAdminCustomer = async (customerId: string, payload: any) => {
    try {
      const response = await apiFetch(`/api/admin/customers/${customerId}`, "ADMIN", {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      const result = (await parseJsonResponse(response)) as { error?: { message?: string } };
      if (!response.ok) throw new Error(result.error?.message ?? "Data customer gagal disimpan.");
      notify("success", "Data customer berhasil diperbarui.");
      await loadAdminData(true);
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Data customer gagal disimpan.");
    }
  };

  const deleteAdminCustomer = async (customerId: string) => {
    if (!window.confirm("Hapus customer ini beserta data terkait?")) return;
    try {
      const response = await apiFetch(`/api/admin/customers/${customerId}`, "ADMIN", { method: "DELETE" });
      const result = (await parseJsonResponse(response)) as { error?: { message?: string } };
      if (!response.ok) throw new Error(result.error?.message ?? "Customer gagal dihapus.");
      notify("success", "Customer berhasil dihapus.");
      await loadAdminData(true);
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Customer gagal dihapus.");
    }
  };

  const updateAdminPartner = async (partnerId: string, payload: any) => {
    try {
      const response = await apiFetch(`/api/admin/partners/${partnerId}`, "ADMIN", {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      const result = (await parseJsonResponse(response)) as { error?: { message?: string } };
      if (!response.ok) throw new Error(result.error?.message ?? "Data partner gagal disimpan.");
      notify("success", "Data partner berhasil diperbarui.");
      await loadAdminData(true);
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Data partner gagal disimpan.");
    }
  };

  const deleteAdminPartner = async (partnerId: string) => {
    if (!window.confirm("Hapus partner ini beserta akun, order, dan data terkait?")) return;
    try {
      const response = await apiFetch(`/api/admin/partners/${partnerId}`, "ADMIN", { method: "DELETE" });
      const result = (await parseJsonResponse(response)) as { error?: { message?: string } };
      if (!response.ok) throw new Error(result.error?.message ?? "Partner gagal dihapus.");
      notify("success", "Partner berhasil dihapus.");
      await loadAdminData(true);
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Partner gagal dihapus.");
    }
  };

  const acceptOrder = async (orderId: string) => {
    try {
      const acceptedOrder = partnerOrders.find((order) => order.id === orderId) ?? null;
      const response = await apiFetch(`/api/orders/${orderId}/accept`, "PARTNER", { method: "POST" });
      if (!response.ok) throw new Error("accept failed");
      notify("success", `Pesanan ${orderId} diterima.`);
      await loadPartnerOrders();
      const trackingOrder = {
        ...acceptedOrder,
        id: orderId,
        status: "CONFIRMED",
        partnerId: acceptedOrder?.partnerId ?? partnerProfile?.id,
        partner: partnerSelf,
        fulfillmentMode: acceptedOrder?.fulfillmentMode ?? "PARTNER_TO_CUSTOMER"
      };
      setSelectedOrder(trackingOrder);
      setLastOrder({
        id: orderId,
        partner: trackingOrder.partner,
        total: acceptedOrder?.total ?? 0,
        status: "confirmed"
      });
      return trackingOrder;
    } catch {
      notify("error", "Gagal menerima pesanan.");
      return null;
    }
  };

  const rejectOrder = async (orderId: string) => {
    try {
      const response = await apiFetch(`/api/orders/${orderId}/reject`, "PARTNER", { method: "POST" });
      if (!response.ok) throw new Error("reject failed");
      notify("success", `Pesanan ${orderId} ditolak.`);
      await loadPartnerOrders();
      return true;
    } catch {
      notify("error", "Gagal menolak pesanan.");
      return false;
    }
  };

  const openOrderCenter = async () => {
    setScreen("orders");
    await loadCustomerOrders();
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return {
        services: customerServices.slice(0, 6),
        partners: customerPartners.slice(0, 6)
      };
    }

    return {
      services: customerServices.filter((service) => service.name.toLowerCase().includes(q)).slice(0, 6),
      partners: customerPartners.filter((partner) => [partner.name, partner.category].some((value) => value.toLowerCase().includes(q))).slice(0, 6)
    };
  }, [customerPartners, customerServices, searchQuery]);

  const partnerListPartners = useMemo(() => {
    if (!selectedCategory) return customerPartners;
    return customerPartners.filter((partner) => serviceCategoryKey(partner.category) === serviceCategoryKey(selectedCategory));
  }, [customerPartners, selectedCategory]);
  const selectedService = useMemo(
    () => (selectedCategory ? customerServices.find((service) => serviceCategoryKey(service.name) === serviceCategoryKey(selectedCategory)) ?? null : null),
    [customerServices, selectedCategory]
  );
  const partnerSelf = useMemo(() => partnerFromProfile(partnerProfile), [partnerProfile]);

  useEffect(() => {
    if (appRole !== "partner") return;
    setPartnerOnline(partnerProfile?.status === "ONLINE" && partnerWalletBalance >= 20000);
  }, [appRole, partnerProfile?.status, partnerWalletBalance]);

  useEffect(() => {
    if (!isAuthorized || typeof window === "undefined") return;
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    const permission = "Notification" in window ? Notification.permission : "unsupported";
    setNotificationPermission(permission);
    if (permission === "granted") {
      void registerPushSubscription().catch(() => undefined);
    }
  }, [isAuthorized, role]);

  useEffect(() => {
    if (!isAuthorized) return;
    void loadNotificationPreferences();
    void loadRealtimeAlerts(role, true);
    void loadSettings();
    if (role === "CUSTOMER") void loadAccount(true);
    if (screen === "home" || screen === "search") void loadCustomerServices();
    if (screen === "home" || screen === "search" || screen === "partnerList") void loadCustomerPartners();
    if (screen === "home") void loadCustomerPromos();
    if (screen === "orders") void loadCustomerOrders();
    if (screen === "partner") {
      void loadPartnerOrders();
      void loadPartnerWallet();
      void loadPartnerProfile();
    }
    if (screen === "admin") void loadAdminData();
  }, [screen, isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) return;
    if (appRole === "customer") {
      void loadNotificationPreferences();
      void loadRealtimeAlerts("CUSTOMER", true);
      void loadSettings();
      void loadAccount(true);
      void loadCustomerServices();
      void loadCustomerPartners();
      void loadCustomerPromos();
      const timer = window.setInterval(() => {
        void loadSettings();
        void loadAccount(true);
        void loadCustomerServices();
        void loadCustomerPartners();
        void loadCustomerPromos();
        void loadRealtimeAlerts("CUSTOMER", true);
        if (screen === "orders" || screen === "tracking") void loadCustomerOrders(true);
      }, 6000);
      return () => window.clearInterval(timer);
    }

    if (appRole === "partner") {
      void loadNotificationPreferences();
      void loadRealtimeAlerts("PARTNER", true);
      void loadPartnerOrders();
      void loadPartnerWallet();
      void loadPartnerProfile();
      const timer = window.setInterval(() => {
        void loadPartnerOrders(true);
        void loadPartnerWallet(true);
        void loadPartnerProfile(true);
        void loadRealtimeAlerts("PARTNER", true);
      }, 5000);
      return () => window.clearInterval(timer);
    }

    if (appRole === "admin") {
      void loadNotificationPreferences();
      void loadRealtimeAlerts("ADMIN", true);
      void loadAdminData();
      const timer = window.setInterval(() => {
        void loadAdminData(true);
        void loadRealtimeAlerts("ADMIN", true);
      }, 8000);
      return () => window.clearInterval(timer);
    }
  }, [appRole, screen, isAuthorized]);

  const selectPartner = (partner: Partner) => {
    if (!customerProfileComplete) {
      notify("error", "Lengkapi nama, nomor HP, dan alamat lengkap dulu.");
      return;
    }
    setCurrentPartner(partner);
    setOrderDraft((draft) => ({
      ...draft,
      partnerId: partner.id,
      serviceCategoryId: `SC-${partner.category.toUpperCase().replaceAll(" ", "-")}`,
      serviceFee: partner.category === "Cuci Sepatu" ? 45000 : partner.category === "Servis Kipas" ? 65000 : 30000,
      scheduleNote: `Estimasi tiba ${partner.eta}`,
      discount: draft.promoStatus === "valid" ? adminSettings.promoDiscount : 0
    }));
    goTo("order");
  };

  const updateDraft = (patch: Partial<OrderDraft>) => {
    setOrderDraft((draft) => ({ ...draft, ...patch }));
  };

  const applyPromo = async () => {
    const promo = orderDraft.promoCode.trim().toUpperCase();
    if (!promo) {
      updateDraft({ promoCode: "", promoStatus: "invalid", discount: 0 });
      notify("error", "Masukkan kode promo terlebih dahulu.");
      return;
    }

    try {
      const latestSettings = await loadSettings();
      const activeAdminPromo = latestSettings?.promoCode.trim().toUpperCase();
      if (latestSettings && activeAdminPromo && promo === activeAdminPromo) {
        const discount = Math.min(latestSettings.promoDiscount, orderTotal(orderDraft));
        updateDraft({ promoCode: activeAdminPromo, promoStatus: "valid", discount });
        notify("success", `Promo ${activeAdminPromo} dari Admin berhasil diterapkan.`);
        return;
      }

      const response = await apiFetch("/api/promos/validate", "CUSTOMER", {
        method: "POST",
        body: JSON.stringify({
          code: promo,
          categoryId: orderDraft.serviceCategoryId,
          orderTotal: orderTotal(orderDraft)
        })
      });
      if (!response.ok) throw new Error("invalid promo");
      const payload = (await parseJsonResponse(response)) as { data: { promo: { code: string; discount: number } } };
      updateDraft({ promoCode: payload.data.promo.code, promoStatus: "valid", discount: payload.data.promo.discount });
      notify("success", `Promo ${payload.data.promo.code} berhasil diterapkan.`);
    } catch {
      updateDraft({ promoCode: promo, promoStatus: "invalid", discount: 0 });
      notify("error", `Kode promo tidak valid. Kode aktif Admin saat ini: ${adminSettings.promoCode}.`);
    }
  };

  const submitOrder = async () => {
    const total = orderTotal(orderDraft);

    if (!customerProfileComplete) {
      notify("error", "Lengkapi nama, nomor HP, dan alamat lengkap dulu.");
      return;
    }

    if (!orderDraft.address.trim()) {
      notify("error", "Alamat pengiriman wajib diisi.");
      return;
    }

    if (!orderDraft.paymentMethod) {
      notify("error", "Pilih metode pembayaran terlebih dahulu.");
      return;
    }

    if (orderDraft.paymentMethod === "SERJAFAN Pay" && accountUser.walletBalance < total) {
      notify("error", "Saldo SERJAFAN Pay belum cukup untuk pesanan ini.");
      return;
    }

    if (
      orderDraft.paymentMethod === "Transfer Bank/DANA Mitra" &&
      !adminSettings.manualBankAccount.trim() &&
      !adminSettings.manualDanaNumber.trim()
    ) {
      notify("error", "Metode transfer manual SERJAFAN belum lengkap. Admin perlu mengisi rekening atau DANA.");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        partnerId: orderDraft.partnerId || undefined,
        serviceCategoryId: orderDraft.serviceCategoryId,
        fulfillmentMode: orderDraft.fulfillmentMode,
        partnerSnapshot: {
          name: currentPartner.name,
          category: currentPartner.category,
          etaMinutes: Number(currentPartner.eta.replace(/[^0-9]/g, "")) || 15,
          priceFrom: currentPartner.priceFrom,
          status: currentPartner.status === "Online" ? "ONLINE" : "BUSY"
        },
        address: {
          title: orderDraft.address,
          subtitle: orderDraft.addressNote,
          latitude: customerMapPoint.lat,
          longitude: customerMapPoint.lng
        },
        schedule: {
          type: orderDraft.schedule === "Sekarang (ASAP)" ? "ASAP" : "SCHEDULED",
          title: orderDraft.schedule,
          subtitle: orderDraft.scheduleNote
        },
        note: orderDraft.note,
        paymentMethod:
          orderDraft.paymentMethod === "SERJAFAN Pay"
            ? "SERJAFAN_PAY"
            : orderDraft.paymentMethod === "Transfer Bank/DANA Mitra"
              ? "DIRECT_TRANSFER"
              : "CASH",
        promoCode: orderDraft.promoStatus === "valid" ? orderDraft.promoCode : null,
        prices: {
          serviceFee: orderDraft.serviceFee,
          platformFee: orderDraft.platformFee,
          discount: orderDraft.discount,
          total
        }
      };
      const response = await apiFetch("/api/orders", "CUSTOMER", {
        method: "POST",
        body: JSON.stringify(orderPayload)
      });
      if (!response.ok) throw new Error("order create failed");
      const payload = (await parseJsonResponse(response)) as { data: { order: { id: string; total: number; status: string } } };
      const createdOrder: LastOrder = {
        id: payload.data.order.id,
        partner: currentPartner,
        total: payload.data.order.total,
        status: "pending"
      };
      setLastOrder(createdOrder);
      setSelectedOrder({
        id: createdOrder.id,
        partnerId: currentPartner.id || null,
        partner: currentPartner,
        status: "PENDING",
        total: createdOrder.total,
        addressTitle: orderDraft.address,
        addressSubtitle: orderDraft.addressNote,
        fulfillmentMode: orderDraft.fulfillmentMode
      });
      notify("success", `Pesanan ${createdOrder.id} dikirim ke SERJAFAN. Tim admin akan menghubungi Anda.`);
      await loadCustomerOrders(true);
      goTo("orders");
    } catch {
      notify("error", "Jaringan bermasalah, coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cloud px-5 text-slate-950">
        <Loader2 className="h-6 w-6 animate-spin text-flame" />
      </main>
    );
  }

  if (requiredRole && authSession?.role !== requiredRole) {
    return <RoleAuthGate role={requiredRole} onAuthenticated={setAuthSession} />;
  }

  return (
    <main className="layout-lock min-h-dvh bg-cloud text-slate-950">
      {showAppHeader && <div className="safe-x app-shell sticky top-0 z-50 flex items-center justify-between gap-2 border-b border-white/10 bg-navy py-2.5 text-white shadow-[0_10px_30px_rgba(11,31,58,0.18)]">
        <div className="flex min-w-0 items-center gap-2.5">
          <BrandMark compact light />
          <div className="min-w-0">
            <p className="truncate text-sm font-black leading-tight">{appTitleByRole[appRole]}</p>
            <p className="truncate text-[10px] font-bold text-white/55">Serba Jasa Fan · Kota Padang</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl bg-white/10 text-white hover:bg-white/20" onClick={() => void openNotifications()}>
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>}

      {showRoleTabs && (
        <Tabs value={activeRoleTab} onValueChange={(value) => goTo(value as Screen)}>
          <TabsList className="safe-x app-shell sticky top-[57px] z-40 overflow-x-auto border-b border-slate-200 bg-white py-3 no-scrollbar">
            {roleTabs.map((item) => (
              <TabsTrigger key={item.value} value={item.value} className="shrink-0">
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <div className="app-shell pb-32">
        {appRole === "customer" && !customerProfileComplete ? (
          <CustomerAccessScreen user={accountUser} onSubmit={submitProfile} />
        ) : screen === "home" && (
          <CustomerHome
            services={customerServices}
            partners={customerPartners}
            promos={customerPromos}
            featureCopy={adminConsole.settings.customerFeatureCopy}
            onOpenPartnerList={openPartnerList}
            onOpenSearch={openSearch}
          />
        )}
        {screen === "search" && (
          <SearchScreen
            query={searchQuery}
            onQueryChange={setSearchQuery}
            services={searchResults.services}
            partners={searchResults.partners}
            onSelectPartner={selectPartner}
            onOpenPartnerList={openPartnerList}
          />
        )}
        {screen === "partnerList" && (
          <PartnerListScreen
            title={selectedCategory ? serviceDisplayName(selectedCategory) : "Daftar Mitra"}
            selectedService={selectedService}
            selectedCategory={selectedCategory}
            partners={partnerListPartners}
            onSelectPartner={selectPartner}
            onBack={() => goTo("home")}
          />
        )}
        {screen === "detail" && (
          <ServiceDetail
            partner={currentPartner}
            onBack={() => goTo("home")}
            onOrder={() => goTo("order")}
            onOpenMessages={() => void openMessages()}
          />
        )}
        {screen === "order" && (
          <OrderFlow
            user={accountUser}
            partner={currentPartner}
            draft={orderDraft}
            settings={adminSettings}
            isSubmitting={isSubmitting}
            onBack={() => goTo("detail")}
            onApplyPromo={applyPromo}
            onSubmit={submitOrder}
            onUpdateDraft={updateDraft}
          />
        )}
        {screen === "orders" && (
          <OrdersCenter
            orders={customerOrders}
            loading={loadingPanel === "orders"}
            onOpenSearch={openSearch}
            onOpenTracking={(order) => {
              const partner = customerPartners.find((item) => item.id === order?.partnerId) ?? getPartnerByOrder(order, currentPartner);
              setSelectedOrder({ ...order, partner });
              setLastOrder(order?.id ? { id: order.id, partner, total: order.total ?? 0, status: "on_the_way" } : null);
              goTo("tracking");
            }}
            onReview={(order, rating, comment) => void submitPartnerReview(order, rating, comment)}
            onOrderNow={() => goTo("home")}
          />
        )}
        {screen === "tracking" && (
          <LiveTracking
            order={lastOrder}
            sourceOrder={selectedOrder}
            fallbackPartner={appRole === "partner" ? partnerSelf : currentPartner}
            viewerRole={appRole === "partner" ? "PARTNER" : "CUSTOMER"}
            onNavigate={goTo}
            onOpenMessages={() => void openMessages()}
            onOpenPhone={openPhone}
          />
        )}
        {screen === "profile" && (
          <ProfileScreen
            user={accountUser}
            onOpenOrders={() => void openOrderCenter()}
            onOpenNotifications={() => void openNotifications()}
            onOpenWallet={() => goTo("wallet")}
            onOpenTopup={() => goTo("topup")}
            onOpenWalletHistory={() => void openWalletHistory()}
            onEditProfile={() => goTo("editProfile")}
            onLogout={logoutCurrentUser}
            orderCount={customerOrders.length}
            onOpenSearch={openSearch}
            onOpenMessages={() => void openMessages()}
          />
        )}
        {screen === "wallet" && <WalletScreen user={accountUser} onBack={() => goTo("profile")} onOpenTopup={() => goTo("topup")} onOpenHistory={() => void openWalletHistory()} />}
        {screen === "topup" && <TopUpScreen balance={accountUser.walletBalance} onBack={() => goTo("wallet")} onSubmit={submitTopUp} settings={adminSettings} />}
        {screen === "walletHistory" && <WalletHistoryScreen transactions={walletTransactions} onBack={() => goTo("profile")} />}
        {screen === "editProfile" && <EditProfileScreen user={accountUser} onBack={() => goTo("profile")} onSubmit={submitProfile} />}
        {screen === "partner" && (
          <PartnerApp
            onNavigate={goTo}
            online={partnerOnline}
            setOnline={(next) => void updatePartnerOnline(next)}
            orderDraft={orderDraft}
            orders={partnerOrders}
            loading={loadingPanel === "partnerOrders"}
            onAcceptOrder={acceptOrder}
            onRejectOrder={rejectOrder}
            onUpdateOrderStatus={updateOrderStatus}
            onOpenTracking={(order) => {
              const partner = partnerSelf;
              setSelectedOrder({ ...order, partner });
              setLastOrder({ id: order.id, partner, total: order.total ?? 0, status: "confirmed" });
              goTo("tracking");
            }}
            onOpenMessages={() => void openMessages()}
            onOpenNotificationSettings={() => setDrawer("notificationSettings")}
            onOpenPhone={openPhone}
            onOpenAccount={() => goTo("partnerAccount")}
            partnerSelf={partnerSelf}
            walletBalance={partnerWalletBalance}
            featureCopy={adminConsole.settings.partnerFeatureCopy}
            onOpenTopup={() => goTo("partnerTopup")}
          />
        )}
        {screen === "partnerAccount" && (
          <PartnerAccountScreen
            orders={partnerOrders}
            walletBalance={partnerWalletBalance}
            profile={partnerProfile}
            onBack={() => goTo("partner")}
            onOpenMessages={() => void openMessages()}
            onOpenPhone={openPhone}
            onOpenTopup={() => goTo("partnerTopup")}
            onSavePayments={savePartnerPayments}
          />
        )}
        {screen === "partnerTopup" && <TopUpScreen mode="partner" balance={partnerWalletBalance} onBack={() => goTo("partnerAccount")} onSubmit={submitPartnerTopUp} settings={adminSettings} />}
        {screen === "admin" && (
          <AdminDashboard
            dashboard={adminDashboard}
            liveOrders={adminLiveOrders}
            mapData={adminMapData}
            consoleData={adminConsole}
            walletData={adminWalletData}
            auditData={adminAuditData}
            pendingPartners={pendingPartners}
            settings={adminSettings}
            loading={loadingPanel === "admin"}
            onReviewPartner={reviewPartner}
            onSaveSettings={saveAdminSettings}
            onSaveConsole={saveAdminConsole}
            onUpdateCustomer={updateAdminCustomer}
            onDeleteCustomer={deleteAdminCustomer}
            onUpdatePartner={updateAdminPartner}
            onDeletePartner={deleteAdminPartner}
            onAdjustWallet={(payload) => void adjustAdminWallet(payload)}
            onOpenMessages={() => void openMessages()}
            onOpenNotificationSettings={() => setDrawer("notificationSettings")}
          />
        )}
      </div>

      {toast && <Toast kind={toast.kind} message={toast.message} />}
      {drawer === "notifications" && (
        <NotificationsDrawer
          loading={loadingPanel === "notifications"}
          items={notifications}
          onClose={() => setDrawer(null)}
          onOpenSettings={() => setDrawer("notificationSettings")}
          onOpenOrders={() => {
            setDrawer(null);
            void openOrderCenter();
          }}
        />
      )}
      {drawer === "messages" && (
        <MessagesDrawerByService role={role} loading={loadingPanel === "messages"} items={messages} onClose={() => setDrawer(null)} onSend={(text, image, orderId) => void sendMessage(text, image, orderId)} />
      )}
      {drawer === "phone" && <PhoneDrawer role={role} partner={currentPartner} onClose={() => setDrawer(null)} />}
      {drawer === "notificationSettings" && (
        <NotificationSettingsDrawer
          role={role}
          preferences={notificationPreferences}
          permission={notificationPermission}
          onRequestPermission={() => void requestBrowserNotifications()}
          onSave={(preferences) => void saveNotificationPreferences(preferences)}
          onTest={(preferences) => {
            if (preferences.soundEnabled) playBell(preferences.soundTone, preferences);
            if (preferences.vibrationEnabled && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([180, 90, 180]);
            showSystemNotification("Tes notifikasi SERJAFAN", preferences.customRingtoneName ? `Nada aktif: ${preferences.customRingtoneName}` : "Nada bawaan aktif.", "notification");
          }}
          onClose={() => setDrawer("notifications")}
        />
      )}
      {showBottomNav && <BottomNav active={screen} unreadMessages={messages.filter((message) => message.unread).length} onNavigate={goTo} onOpenMessages={() => void openMessages()} onOpenProfile={openProfile} />}
    </main>
  );
}

function CustomerHome({
  services,
  partners,
  promos,
  featureCopy,
  onOpenPartnerList,
  onOpenSearch,
}: {
  services: ServiceItem[];
  partners: Partner[];
  promos: PromoBanner[];
  featureCopy: AdminConsoleData["settings"]["customerFeatureCopy"];
  onOpenPartnerList: (category?: string) => void;
  onOpenSearch: () => void;
}) {
  const partnerCountByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    partners.forEach((partner) => {
      const key = serviceCategoryKey(partner.category);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [partners]);

  const resolveCategory = (target: string) =>
    services.find((service) => serviceCategoryKey(service.name) === serviceCategoryKey(target))?.name ?? target;

  const openCategory = (target?: string) => {
    onOpenPartnerList(target ? resolveCategory(target) : undefined);
  };
  const dashboardServices = services.length ? services.slice(0, 8) : [];
  const popularServices = services.length ? services.slice(0, 3) : [];
  const nearbyPartners = partners.filter((partner) => partner.status === "Online").slice(0, 3);
  const rawHeroTitle = featureCopy.headline?.trim() || "";
  const heroTitle = !rawHeroTitle || rawHeroTitle.toLowerCase() === "customer app" ? "Semua Jasa" : rawHeroTitle;
  const heroDescription = featureCopy.description?.trim() || "Cepat - Mudah - Terpercaya";

  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 min-h-dvh bg-[#f5f7fb] pb-24 duration-300">
      <header className="relative h-[150px] overflow-hidden rounded-b-[32px] bg-gradient-to-br from-[#0d47d9] to-[#003cb5] px-4 pt-7 text-white">
        <div className="absolute -right-20 top-8 h-56 w-56 rounded-full bg-white/10" />
        <div className="absolute -left-16 top-24 h-36 w-36 rounded-full bg-[#2f7cff]/25 blur-xl" />
        <div className="relative flex items-center justify-between gap-4">
          <CustomerWordmark />
          <button type="button" className="flex min-w-0 shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-sm font-bold text-white" onClick={onOpenSearch}>
            <MapPin className="h-5 w-5 shrink-0 fill-white text-white" />
            <span className="truncate">Padang</span>
            <ChevronRight className="h-5 w-5 rotate-90" />
          </button>
        </div>
      </header>

      <div className="px-4">
        <button type="button" onClick={onOpenSearch} className="relative z-20 -mt-7 flex h-14 w-full items-center gap-3 rounded-2xl bg-white px-4 text-left shadow-[0_14px_34px_rgba(15,23,42,0.12)] ring-1 ring-slate-100 transition active:scale-[0.99]">
          <Search className="h-6 w-6 shrink-0 text-[#9ca3af]" />
          <span className="min-w-0 flex-1 truncate whitespace-nowrap text-[15px] font-medium leading-none text-[#9ca3af]">Cari layanan yang Anda butuhkan...</span>
        </button>

        <Card className="mt-5 h-[160px] overflow-hidden rounded-[20px] border-0 bg-gradient-to-br from-[#0f5bff] to-[#003ccf] shadow-[0_16px_34px_rgba(13,71,217,0.18)]">
          <CardContent className="relative h-full p-0">
          <img
            src="/rumah-gadang-padang.svg"
            alt="Rumah Gadang Padang"
            className="absolute inset-y-0 right-0 h-full w-[50%] rounded-r-[20px] object-cover object-center"
          />
          <div className="absolute inset-y-0 left-0 w-[66%] bg-gradient-to-r from-[#0f5bff] via-[#0f5bff]/96 to-[#0f5bff]/18" />
          <div className="relative flex h-full max-w-[64%] flex-col justify-center px-5">
            <h1 className="line-clamp-2 text-[32px] font-black leading-none tracking-tight text-white">{heroTitle}</h1>
            <p className="mt-2 text-[24px] font-extrabold leading-tight text-[#ffd54a]">Dalam Satu Aplikasi</p>
            <p className="mt-3 line-clamp-2 text-[15px] font-semibold text-white/90">{heroDescription}</p>
          </div>
          </CardContent>
        </Card>

        <PromoShowcase promos={promos} onOpenPartnerList={openCategory} />

        <Card className="mt-4 rounded-[24px] border-0 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100">
          <CardContent className="p-5">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-950">Kategori Layanan</h2>
            <Button type="button" variant="ghost" size="sm" onClick={() => openCategory()} className="h-auto px-0 text-sm font-black text-[#0d47d9] hover:bg-transparent hover:text-[#003cb5]">
              Lihat Semua
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-x-2 gap-y-7">
          {dashboardServices.map((service) => {
            const Icon = service.icon;
            const count = partnerCountByCategory.get(serviceCategoryKey(service.name)) ?? 0;
            return (
            <button
              key={service.id ?? service.name}
              type="button"
              onClick={() => openCategory(service.name)}
              className="group min-w-0 text-center"
            >
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef4ff] text-[#0d47d9] transition group-active:scale-95 group-hover:bg-[#dfeaff]">
                <Icon className="h-7 w-7" />
              </span>
              <span className="mt-3 block text-balance-mobile text-[13px] font-semibold leading-4 text-slate-900">{customerCategoryLabel(service.name)}</span>
              <span className="sr-only">{count ? `${count} mitra aktif` : "Belum ada mitra"}</span>
            </button>
            );
          })}
          </div>
          </CardContent>
        </Card>

        <Card className="mt-4 rounded-[20px] border-0 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
          <CardContent className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-950">Layanan Populer</h2>
            <Button type="button" variant="ghost" size="sm" onClick={() => openCategory()} className="h-auto px-0 text-sm font-black text-[#0d47d9] hover:bg-transparent hover:text-[#003cb5]">
              Lihat Semua
            </Button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {popularServices.map((service) => (
              <button key={service.id ?? service.name} type="button" onClick={() => openCategory(service.name)} className="w-[140px] shrink-0 overflow-hidden rounded-[18px] bg-white text-left shadow-[0_8px_22px_rgba(15,23,42,0.10)] ring-1 ring-slate-100 transition active:scale-[0.98]">
                <img src={serviceDashboardImage(service.name)} alt={service.name} className="h-[110px] w-full object-cover" />
                <div className="p-3">
                  <p className="line-clamp-1 text-[15px] font-black leading-5 text-slate-950">{customerCategoryLabel(service.name)}</p>
                  <p className="mt-2 flex items-center gap-1 text-sm font-black text-slate-800">
                    <Star className="h-4 w-4 fill-[#ffbd16] text-[#ffbd16]" /> 4.9
                  </p>
                </div>
              </button>
            ))}
          </div>
          </CardContent>
        </Card>

        <Card className="mt-4 rounded-[20px] border-0 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
          <CardContent className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-950">Layanan Terdekat</h2>
              <Button type="button" variant="ghost" size="sm" onClick={() => openCategory()} className="h-auto px-0 text-sm font-black text-[#0d47d9] hover:bg-transparent hover:text-[#003cb5]">
                Lihat Semua
              </Button>
            </div>
            <div className="grid gap-2">
              {nearbyPartners.length ? nearbyPartners.map((partner) => {
                const Icon = partner.Icon;
                return (
                  <button key={partner.id} type="button" onClick={() => onOpenPartnerList(partner.category)} className="flex items-center gap-3 rounded-[16px] bg-[#f7faff] p-3 text-left">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#eef4ff] text-[#0d47d9]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black">{partner.name}</span>
                      <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">{partner.category} - {partner.distance}</span>
                    </span>
                    <Badge variant="success" className="shrink-0">{partner.eta}</Badge>
                  </button>
                );
              }) : <p className="rounded-[16px] bg-[#f7faff] p-4 text-xs font-semibold text-slate-500">Belum ada mitra online di sekitar lokasi customer.</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4 h-[132px] overflow-hidden rounded-[20px] border-0 bg-gradient-to-br from-[#0d47d9] to-[#003cb5] text-white shadow-[0_12px_30px_rgba(13,71,217,0.20)]">
          <CardContent className="relative h-full p-0">
          <div className="absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-white/12" />
          <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/10" />
          <div className="relative grid h-full grid-cols-[76px_1fr] grid-rows-[1fr_auto] items-center gap-x-3 px-4 py-3 min-[410px]:grid-cols-[82px_1fr_auto] min-[410px]:grid-rows-1 min-[410px]:py-0">
            <div className="relative row-span-2 h-[102px] w-[70px] rounded-[16px] border-[5px] border-white bg-white shadow-[0_12px_24px_rgba(0,0,0,0.20)] min-[410px]:h-[104px] min-[410px]:w-[74px]">
              <div className="absolute left-1/2 top-2 h-1 w-8 -translate-x-1/2 rounded-full bg-slate-200" />
              <div className="flex h-full items-center justify-center rounded-[11px] bg-white">
                <img src="/serjafan-logo.png" alt="SERJAFAN" className="h-11 w-11 object-contain" />
              </div>
            </div>
            <div className="min-w-0 self-end min-[410px]:self-center">
              <p className="text-[21px] font-black leading-tight">Butuh Jasa?</p>
              <p className="text-[21px] font-black leading-tight"><span className="text-[#ffd54a]">SERJAFAN</span> Aja!</p>
              <p className="mt-1 max-w-[170px] text-[12px] font-medium leading-4 text-white/86 min-[410px]:max-w-none min-[410px]:text-[13px] min-[410px]:leading-5">Solusi cepat untuk kebutuhan Anda.</p>
            </div>
            <Button type="button" onClick={() => openCategory()} className="col-start-2 h-10 w-fit shrink-0 self-start rounded-full bg-[#ffd54a] px-4 text-[12px] font-black text-slate-800 shadow-[0_8px_18px_rgba(0,0,0,0.16)] hover:bg-[#ffe071] min-[410px]:col-auto min-[410px]:h-11 min-[410px]:self-center min-[410px]:text-[13px]">
              Pesan Sekarang <ChevronRight className="h-5 w-5 rounded-full bg-[#0d47d9] p-0.5 text-white" />
            </Button>
          </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function PromoShowcase({ promos, onOpenPartnerList }: { promos: PromoBanner[]; onOpenPartnerList: (category?: string) => void }) {
  const fallbackPromos: PromoBanner[] = [
    {
      code: "SERJAFAN",
      title: "Promo dari Admin SERJAFAN",
      description: "Admin bisa mengubah promo ini dari Pusat Kontrol Admin, termasuk menambah foto atau video.",
      discount: 0,
      mediaUrl: null,
      mediaType: null
    }
  ];
  const visiblePromos = promos.length ? promos : fallbackPromos;

  return (
    <section className="mt-4 rounded-[22px] bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-950">Promo Hari Ini</h2>
        <span className="text-xs font-black text-slate-400">Geser</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
        {visiblePromos.map((promo, index) => (
          <button
            key={`${promo.code}-${index}`}
            type="button"
            onClick={() => onOpenPartnerList()}
            className="group relative min-h-[184px] min-w-[286px] overflow-hidden rounded-[24px] bg-white text-left shadow-soft transition hover:-translate-y-0.5 min-[390px]:min-w-[330px]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-navy via-[#173762] to-[#0f766e]" />
            {promo.mediaUrl ? (
              promo.mediaType === "video" ? (
                <video src={promo.mediaUrl} className="absolute inset-0 h-full w-full object-cover opacity-45" muted loop playsInline autoPlay />
              ) : (
                <img src={promo.mediaUrl} alt={promo.title} className="absolute inset-0 h-full w-full object-cover opacity-45" />
              )
            ) : (
              <div className="absolute right-[-42px] top-[-36px] h-36 w-36 rounded-full bg-flame/30 transition group-hover:scale-110" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-navy/92 via-navy/64 to-navy/20" />
            <div className="relative flex min-h-[184px] flex-col justify-between p-4 text-white">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <Badge className="rounded-full bg-white/18 px-3 py-1 text-[10px] font-black text-white backdrop-blur">{promo.code || "PROMO"}</Badge>
                  <span className="rounded-full bg-flame px-3 py-1 text-[10px] font-black">
                    {promo.discount ? `Hemat Rp ${formatRupiah(promo.discount)}` : "Promo aktif"}
                  </span>
                </div>
                <h3 className="mt-4 max-w-[220px] text-[18px] font-black leading-tight">{promo.title}</h3>
                <p className="mt-2 line-clamp-2 max-w-[235px] text-xs font-semibold leading-5 text-white/74">{promo.description || promo.note}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">SERJAFAN Promo</span>
                <span className="flex items-center gap-1 rounded-full bg-white px-3 py-2 text-[11px] font-black text-navy">
                  Pakai <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function ServiceDetail({
  partner,
  onBack,
  onOrder,
  onOpenMessages
}: {
  partner: Partner;
  onBack: () => void;
  onOrder: () => void;
  onOpenMessages: () => void;
}) {
  const Icon = partner.Icon;

  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 bg-white pb-6 duration-300">
      <div className="bg-[#0648bd] px-5 pb-12 pt-5 text-white">
        <div className="flex items-center justify-between gap-3">
          <Button size="icon" variant="ghost" className="rounded-full bg-white/10 text-white hover:bg-white/20" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <BrandMark light />
          <button type="button" className="rounded-full bg-white/10 p-2.5">
            <Heart className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="-mt-8 px-5">
        <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_12px_34px_rgba(15,23,42,0.12)]">
          <div className="flex h-36 items-center justify-center bg-[#eef5ff] text-[#075bdd]">
            <Icon className="h-16 w-16" />
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-black leading-tight text-slate-950">{partner.name}</h1>
                <p className="mt-1 text-sm font-bold text-slate-500">{partner.category} - Kota Padang</p>
              </div>
              <Badge variant={partner.status === "Online" ? "success" : "warning"}>{partner.status}</Badge>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="blue" className="gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Terverifikasi
              </Badge>
              <span className="text-xs font-bold text-slate-400">{partner.distance}</span>
            </div>
          </div>
        </div>

        <div className="my-4 grid grid-cols-2 gap-2.5 min-[390px]:grid-cols-4">
          {[
            [partner.rating, "Rating"],
            [partner.orders, "Selesai"],
            ["Terverifikasi", "Identitas"],
            [partner.distance, "Jarak"]
          ].map(([value, label]) => (
            <div key={label} className="rounded-[16px] bg-[#f4f8ff] p-3 text-center">
              <p className="truncate text-sm font-black text-slate-950">{value}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[18px] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
          <h2 className="text-[15px] font-black text-slate-950">Tentang Layanan</h2>
          <p className="mt-2 text-xs leading-6 text-slate-500">
            Layanan {partner.category.toLowerCase()} profesional dari SERJAFAN. Estimasi kedatangan,
            biaya, dan status penugasan dibaca dari state yang sama untuk detail, checkout, dan tracking.
          </p>
        </div>

        <div className="my-4 flex items-center justify-between rounded-[18px] bg-[#075bdd] p-5 text-white">
          <div>
            <p className="text-xs font-semibold text-white/80">Estimasi Harga</p>
            <p className="text-[11px] text-white/70">Tergantung detail pekerjaan</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-white/80">Mulai dari</p>
            <p className="text-[22px] font-extrabold">Rp {formatRupiah(partner.priceFrom)}</p>
          </div>
        </div>

        <h2 className="mb-2 text-[15px] font-black text-slate-950">Ulasan Pelanggan</h2>
        <div className="rounded-[16px] bg-[#f4f8ff] p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#075bdd] text-[13px] font-bold text-white">
              SF
            </span>
            <span className="text-xs font-bold">Pelanggan SERJAFAN</span>
            <span className="ml-auto flex text-amber-500">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-3 w-3 fill-current" />
              ))}
            </span>
          </div>
          <p className="text-xs text-slate-500">Cepat banget, hasilnya rapi, harga wajar. Recommended!</p>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_1.4fr] gap-2.5">
          <Button variant="outline" size="lg" className="rounded-[14px] border-2 border-[#075bdd] text-[#075bdd]" onClick={onOpenMessages}>
            <MessageCircle className="h-4 w-4" /> Chat SERJAFAN
          </Button>
          <Button size="lg" className="rounded-[14px] bg-[#075bdd] text-white hover:bg-[#0648bd]" onClick={onOrder}>
            <ShoppingCart className="h-4 w-4" /> Pesan Sekarang
          </Button>
        </div>
      </div>
    </section>
  );
}

function SearchScreen({
  query,
  onQueryChange,
  services,
  partners,
  onSelectPartner,
  onOpenPartnerList
}: {
  query: string;
  onQueryChange: (value: string) => void;
  services: ServiceItem[];
  partners: PartnerItem[];
  onSelectPartner: (partner: Partner) => void;
  onOpenPartnerList: (category?: string) => void;
}) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 p-5 duration-300">
      <h1 className="text-xl font-extrabold">Cari</h1>
      <div className="mt-4 flex items-center gap-3 rounded-[14px] border border-slate-100 bg-white px-4 py-3 shadow-soft">
        <Search className="h-5 w-5 text-flame" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Cari layanan SERJAFAN"
          className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </div>

      <Section title={query ? "Kategori ditemukan" : "Kategori populer"}>
        <div className="grid grid-cols-2 gap-2">
          {services.map((service) => (
            <button key={service.name} type="button" onClick={() => onOpenPartnerList(service.name)} className="flex items-center gap-3 rounded-[14px] bg-white p-3 text-left shadow-soft">
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-[12px]", service.tone)}>
                <service.icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-extrabold">{service.name}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Cara SERJAFAN menangani pesanan">
        <div className="rounded-[18px] bg-white p-4 shadow-soft">
          <div className="grid gap-2">
            {["Customer memilih layanan", "SERJAFAN menerima detail kebutuhan", "Admin menugaskan teknisi internal", "Customer memantau status dari SERJAFAN"].map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-[14px] bg-[#f8fbff] p-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0d47d9] text-xs font-black text-white">{index + 1}</span>
                <span className="text-xs font-extrabold text-slate-700">{item}</span>
              </div>
            ))}
          </div>
          {partners.length > 0 && (
            <Button type="button" className="mt-4 h-11 w-full rounded-2xl bg-[#0d47d9] text-white" onClick={() => onSelectPartner(partners[0])}>
              Mulai Pesanan SERJAFAN
            </Button>
          )}
        </div>
      </Section>
    </section>
  );
}

function PartnerListScreen({
  title,
  selectedService,
  selectedCategory,
  partners,
  onSelectPartner,
  onBack
}: {
  title: string;
  selectedService: ServiceItem | null;
  selectedCategory: string | null;
  partners: Partner[];
  onSelectPartner: (partner: Partner) => void;
  onBack: () => void;
}) {
  const Icon = selectedService?.icon ?? Wrench;
  const assignedTechnician = partners.find((partner) => partner.status === "Online") ?? partners[0];
  const operationalRequest: Partner = assignedTechnician ?? {
    ...emptyPartner,
    category: selectedCategory ?? selectedService?.name ?? "Jasa SERJAFAN",
    Icon,
    priceFrom: selectedService?.basePrice ?? emptyPartner.priceFrom,
    eta: "Admin konfirmasi",
    status: "Online"
  };
  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="relative overflow-hidden rounded-b-[28px] bg-navy px-5 pb-6 pt-5 text-white">
        <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-flame/15" />
        <div className="relative flex items-center gap-3">
          <Button size="icon" variant="ghost" className="shrink-0 rounded-xl bg-white/12 text-white hover:bg-white/20" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">Permintaan Layanan</p>
            <h1 className="truncate text-xl font-black">{title}</h1>
          </div>
        </div>
        <div className="relative mt-5 rounded-[20px] bg-white/10 p-4 backdrop-blur">
          <div className="flex items-start gap-3">
            <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-white text-navy", selectedService?.tone)}>
              <Icon className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold">Pesanan ditangani oleh SERJAFAN</p>
              <p className="mt-1 text-xs leading-5 text-white/70">
                {selectedService ? serviceShortCopy(selectedService) : "Customer tidak memilih teknisi. SERJAFAN menerima order dan menugaskan teknisi lapangan yang sesuai."}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-[14px] bg-white/10 p-3">
              <p className="text-[10px] font-bold uppercase text-white/55">Penugasan</p>
              <p className="mt-1 text-lg font-black">{assignedTechnician ? "Siap" : "Admin"}</p>
            </div>
            <div className="rounded-[14px] bg-white/10 p-3">
              <p className="text-[10px] font-bold uppercase text-white/55">Harga mulai</p>
              <p className="mt-1 text-lg font-black">{selectedService?.basePrice ? `Rp ${formatRupiah(selectedService.basePrice)}` : "Cek admin"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-5">
          <div className="rounded-[24px] bg-white p-5 shadow-soft">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#eef4ff] text-[#0d47d9]">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-base font-black">Tim SERJAFAN akan mengatur layanan</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Pesanan Anda masuk ke operasional SERJAFAN. Admin memantau order, menghubungi customer, menugaskan teknisi lapangan,
                  dan customer tetap berkomunikasi melalui SERJAFAN.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              {["Pesanan diterima SERJAFAN", "Detail kebutuhan dicek", "Teknisi lapangan ditugaskan", "Status bisa dilacak"].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-[14px] bg-slate-50 p-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0d47d9] text-xs font-black text-white">{index + 1}</span>
                  <span className="text-sm font-bold text-slate-700">{item}</span>
                </div>
              ))}
            </div>
            <Button className="mt-5 h-12 w-full rounded-2xl bg-[#0d47d9] text-sm font-black text-white hover:bg-[#003cb5]" onClick={() => onSelectPartner(operationalRequest)}>
              Isi Detail Kebutuhan <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
      </div>
    </section>
  );
}

function PartnerListItem({ partner, onSelect }: { partner: Partner; onSelect: () => void }) {
  const Icon = partner.Icon;
  return (
    <button type="button" onClick={onSelect} className="flex w-full items-center gap-3 rounded-[18px] border border-slate-100 bg-white p-4 text-left shadow-soft transition hover:-translate-y-0.5">
      <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]", partner.tone)}>
        <Icon className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-extrabold">{partner.name}</span>
        <span className="block text-xs text-slate-500">
          {partner.category} - {partner.distance} - {partner.eta}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-500">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {partner.rating}
          </span>
          <span>{partner.orders} order</span>
          <span>Mulai Rp {formatRupiah(partner.priceFrom)}</span>
        </span>
      </span>
      <Badge variant={partner.status === "Online" ? "success" : "warning"}>{partner.status}</Badge>
    </button>
  );
}

function OrderFlow({
  user,
  partner,
  draft,
  settings,
  isSubmitting,
  onBack,
  onApplyPromo,
  onSubmit,
  onUpdateDraft
}: {
  user: CurrentUser;
  partner: Partner;
  draft: OrderDraft;
  settings: AdminSettings;
  isSubmitting: boolean;
  onBack: () => void;
  onApplyPromo: () => void;
  onSubmit: () => void;
  onUpdateDraft: (patch: Partial<OrderDraft>) => void;
}) {
  const [editor, setEditor] = useState<"address" | "schedule" | "note" | null>(null);
  const total = orderTotal(draft);
  const manualPaymentReady = Boolean(settings.manualBankAccount.trim() || settings.manualDanaNumber.trim());
  const paymentLabel = (name: PayMethod) => (name === "Transfer Bank/DANA Mitra" ? "Transfer Manual SERJAFAN" : name);
  const payments: { name: PayMethod; Icon: React.ElementType }[] = [
    { name: "SERJAFAN Pay", Icon: Wallet },
    { name: "Transfer Bank/DANA Mitra", Icon: CreditCard },
    ...(partner.acceptsCash === false ? [] : [{ name: "Tunai" as PayMethod, Icon: Wallet }])
  ];

  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 p-5 duration-300">
      <div className="mb-5 flex items-center gap-3">
        <Button size="icon" variant="secondary" className="rounded-[10px]" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-extrabold">Konfirmasi Pesanan</h1>
          <p className="text-xs text-slate-500">Pesanan diterima dan dikelola SERJAFAN</p>
        </div>
      </div>

      <FormBlock
        label="Lokasi Pengiriman"
        icon={MapPin}
        title={draft.address || "Pilih alamat"}
        note={draft.addressNote}
        onClick={() => setEditor("address")}
      />
      <Label>Arah Layanan</Label>
      <div className="mb-3.5 grid grid-cols-2 gap-2">
        {[
          {
            value: "PARTNER_TO_CUSTOMER" as FulfillmentMode,
            title: "Teknisi ke Saya",
            note: "SERJAFAN menugaskan teknisi ke lokasi customer"
          },
          {
            value: "CUSTOMER_TO_PARTNER" as FulfillmentMode,
            title: "Saya ke Lokasi",
            note: "Untuk layanan antar atau datang ke titik SERJAFAN"
          }
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onUpdateDraft({ fulfillmentMode: option.value })}
            className={cn(
              "rounded-[14px] border-2 bg-white p-3 text-left shadow-[0_2px_10px_rgba(11,31,58,0.06)] transition",
              draft.fulfillmentMode === option.value ? "border-flame bg-orange-50" : "border-transparent"
            )}
          >
            <span className="flex items-center gap-2 text-xs font-extrabold">
              <Navigation className={cn("h-4 w-4", draft.fulfillmentMode === option.value ? "text-flame" : "text-slate-400")} />
              {option.title}
            </span>
            <span className="mt-1 block text-[11px] leading-4 text-slate-500">{option.note}</span>
          </button>
        ))}
      </div>
      <FormBlock
        label="Jadwal Layanan"
        icon={Calendar}
        title={draft.schedule}
        note={draft.scheduleNote}
        onClick={() => setEditor("schedule")}
      />
      <FormBlock
        label="Detail Kebutuhan untuk SERJAFAN"
        icon={MessageCircle}
        title={draft.note || "Jelaskan masalah atau kebutuhan Anda"}
        note={draft.noteMeta}
        onClick={() => setEditor("note")}
      />

      <Label>Metode Pembayaran</Label>
      <div className="mb-4 grid grid-cols-1 gap-2 min-[380px]:grid-cols-3">
        {payments.map(({ name, Icon }) => {
          const disabled = name === "Transfer Bank/DANA Mitra" && !manualPaymentReady;
          return (
          <button
            key={name}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!disabled) onUpdateDraft({ paymentMethod: name });
            }}
            className={cn(
              "min-h-[76px] rounded-[14px] border-2 bg-white p-3 text-center shadow-[0_2px_10px_rgba(11,31,58,0.06)] transition",
              draft.paymentMethod === name ? "border-flame bg-orange-50 text-flame" : "border-transparent text-slate-500",
              disabled && "cursor-not-allowed opacity-45"
            )}
          >
            <Icon className="mx-auto mb-1 h-5 w-5" />
            <span className="text-[10px] font-bold leading-tight">{paymentLabel(name)}</span>
          </button>
          );
        })}
      </div>

      <Label>Kode Promo</Label>
      <div className="mb-2 flex items-center gap-2 rounded-[14px] border border-slate-100 bg-white px-4 py-3 shadow-[0_2px_12px_rgba(11,31,58,0.06)]">
        <Tag className="h-5 w-5 text-slate-500" />
        <Input
          value={draft.promoCode}
          onChange={(event) => onUpdateDraft({ promoCode: event.target.value, promoStatus: "idle", discount: 0 })}
          className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
        <Button variant="navy" size="sm" className="rounded-[10px]" onClick={onApplyPromo}>
          Pakai
        </Button>
      </div>
      <p className="mb-2 text-xs text-slate-500">
        Kode aktif Admin: <span className="font-extrabold text-flame">{settings.promoCode}</span> - Diskon Rp {formatRupiah(settings.promoDiscount)}
      </p>
      {draft.promoStatus === "valid" && <p className="mb-4 text-xs font-bold text-emerald-600">Promo aktif: hemat Rp {formatRupiah(draft.discount)}</p>}
      {draft.promoStatus === "invalid" && <p className="mb-4 text-xs font-bold text-red-600">Promo tidak valid. Ringkasan biaya sudah diperbarui.</p>}
      {draft.promoStatus === "idle" && <p className="mb-4 text-xs text-slate-500">Masukkan kode lalu tekan Pakai untuk validasi.</p>}

      <div className="mb-5 rounded-[16px] bg-cloud p-4">
        {[
          ["Biaya layanan", `Rp ${formatRupiah(draft.serviceFee)}`],
          ["Biaya platform", `Rp ${formatRupiah(draft.platformFee)}`],
          [`Diskon ${draft.promoStatus === "valid" ? draft.promoCode : ""}`.trim(), `-Rp ${formatRupiah(draft.discount)}`]
        ].map(([label, value]) => (
          <div key={label} className="mb-2 flex justify-between text-[13px] text-slate-500">
            <span>{label}</span>
            <span className={label.includes("Diskon") ? "text-emerald-600" : ""}>{value}</span>
          </div>
        ))}
        <div className="mt-3 flex justify-between border-t border-slate-300 pt-3 text-[15px] font-extrabold">
          <span>Total Bayar</span>
          <span className="text-flame">Rp {formatRupiah(total)}</span>
        </div>
        {draft.paymentMethod === "SERJAFAN Pay" && (
          <p className="mt-2 text-[11px] text-slate-500">Saldo tersedia: Rp {formatRupiah(user.walletBalance)}</p>
        )}
        {draft.paymentMethod === "Transfer Bank/DANA Mitra" && (
          <div className="mt-3 rounded-[14px] bg-white p-3 text-[11px] font-bold leading-5 text-slate-600">
            <p className="text-navy">Customer mengikuti instruksi pembayaran manual SERJAFAN. Bukti transfer dikirim ke SERJAFAN agar admin dapat memverifikasi dan meneruskan proses layanan.</p>
            {settings.manualBankAccount.trim() && (
              <div className="mt-2 rounded-[10px] bg-cloud p-2">
                <p>Bank operasional: <span className="text-navy">{settings.manualBankName || "Bank SERJAFAN"}</span></p>
                <p>Rekening: <span className="text-navy">{settings.manualBankAccount}</span></p>
                <p>Nama: <span className="text-navy">{settings.manualBankHolder || "SERJAFAN"}</span></p>
              </div>
            )}
            {settings.manualDanaNumber.trim() && (
              <div className="mt-2 rounded-[10px] bg-cloud p-2">
                <p>DANA: <span className="text-navy">{settings.manualDanaNumber}</span></p>
                <p>Nama: <span className="text-navy">{settings.manualDanaName || "SERJAFAN"}</span></p>
              </div>
            )}
            {!manualPaymentReady && <p className="mt-2 text-red-600">Data pembayaran manual SERJAFAN belum lengkap. Admin perlu mengisi rekening atau DANA.</p>}
          </div>
        )}
        {draft.paymentMethod === "Tunai" && (
          <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500">
            Customer membayar tunai setelah pekerjaan selesai. Pesanan tetap tercatat di admin dan kualitas layanan dipantau SERJAFAN.
          </p>
        )}
      </div>

      <Button variant="orange" size="lg" className="w-full" disabled={isSubmitting} onClick={onSubmit}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {isSubmitting ? "Memproses..." : draft.paymentMethod === "Tunai" ? `Konfirmasi Pesanan Tunai Rp ${formatRupiah(total)}` : `Konfirmasi & Bayar Rp ${formatRupiah(total)}`}
      </Button>

      {editor && (
        <OrderEditor
          editor={editor}
          draft={draft}
          onClose={() => setEditor(null)}
          onUpdate={(patch) => {
            onUpdateDraft(patch);
            setEditor(null);
          }}
        />
      )}
    </section>
  );
}

function OrderEditor({
  editor,
  draft,
  onClose,
  onUpdate
}: {
  editor: "address" | "schedule" | "note";
  draft: OrderDraft;
  onClose: () => void;
  onUpdate: (patch: Partial<OrderDraft>) => void;
}) {
  const [value, setValue] = useState(editor === "address" ? draft.address : editor === "schedule" ? draft.schedule : draft.note);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-navy/30 px-4 pb-4">
      <div className="w-full max-w-[388px] rounded-[20px] bg-white p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-extrabold">
            {editor === "address" ? "Pilih Alamat" : editor === "schedule" ? "Pilih Jadwal" : "Catatan SERJAFAN"}
          </h2>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {editor === "address" && (
          <div className="space-y-2">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-[14px] border border-slate-100 bg-cloud p-3 text-left"
              onClick={() =>
                onUpdate({
                  address: "Lokasi saat ini",
                  addressNote: "Terdeteksi di sekitar Kota Padang"
                })
              }
            >
              <Navigation className="h-5 w-5 text-flame" />
              <span className="text-xs font-bold">Gunakan lokasi saat ini</span>
            </button>
            <Input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Tulis alamat lengkap" />
            <Button
              variant="navy"
              className="w-full"
              onClick={() => onUpdate({ address: value, addressNote: "Alamat tersimpan untuk pesanan ini" })}
            >
              Simpan Alamat
            </Button>
          </div>
        )}

        {editor === "schedule" && (
          <div className="grid gap-2">
            {[
              ["Sekarang (ASAP)", "Estimasi tiba ~15 menit"],
              ["Hari ini, 19:00", "Mitra datang sesuai slot malam"],
              ["Besok, 09:00", "Mitra datang di pagi hari"]
            ].map(([schedule, note]) => (
              <button
                key={schedule}
                type="button"
                className="flex items-center gap-3 rounded-[14px] border border-slate-100 bg-cloud p-3 text-left"
                onClick={() => onUpdate({ schedule, scheduleNote: note })}
              >
                <Clock className="h-5 w-5 text-flame" />
                <span>
                  <span className="block text-xs font-bold">{schedule}</span>
                  <span className="block text-[11px] text-slate-500">{note}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {editor === "note" && (
          <div className="space-y-3">
            <textarea
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="min-h-24 w-full rounded-[14px] border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-flame"
              placeholder="Contoh: kunci rumah dan motor Honda, mohon bawa blank key."
            />
            <Button
              variant="navy"
              className="w-full"
              onClick={() => onUpdate({ note: value, noteMeta: value ? "Catatan diperbarui" : "Tanpa catatan tambahan" })}
            >
              Simpan Catatan
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function LiveTracking({
  order,
  sourceOrder,
  fallbackPartner,
  viewerRole,
  onNavigate,
  onOpenMessages,
  onOpenPhone
}: {
  order: LastOrder | null;
  sourceOrder?: any;
  fallbackPartner: Partner;
  viewerRole?: "CUSTOMER" | "PARTNER";
  onNavigate: (screen: Screen) => void;
  onOpenMessages: () => void;
  onOpenPhone: () => void;
}) {
  const partner = order?.partner ?? fallbackPartner;
  const initialMode = (sourceOrder?.fulfillmentMode as FulfillmentMode | undefined) ?? "PARTNER_TO_CUSTOMER";
  const [trackingMode, setTrackingMode] = useState<FulfillmentMode>(initialMode);
  const route = routeForOrder(sourceOrder ?? { partnerId: partner.id, status: order?.status }, partner, trackingMode);
  const isPartnerComing = trackingMode === "PARTNER_TO_CUSTOMER";
  const backTarget: Screen = viewerRole === "PARTNER" ? "partner" : "orders";
  const backLabel = viewerRole === "PARTNER" ? "Kembali ke dashboard pemesanan" : "Kembali ke pesanan saya";
  const progressPercent = sourceOrder?.status === "DONE" ? 100 : sourceOrder?.status === "ON_THE_WAY" ? 75 : sourceOrder?.status === "PARTNER_READY" ? 50 : 35;
  const shareOrder = () => {
    const text = `Pesanan SERJAFAN ${route.orderId ?? ""} - ${partner.category}`;
    const nav =
      typeof navigator !== "undefined"
        ? (navigator as Navigator & {
            share?: (data: ShareData) => Promise<void>;
            clipboard?: Pick<Clipboard, "writeText">;
          })
        : null;

    if (nav?.share) {
      void nav.share({ title: "Pesanan SERJAFAN", text }).catch(() => undefined);
    } else if (nav?.clipboard) {
      void nav.clipboard.writeText(text);
    }
  };

  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 pb-36 duration-300">
      <div className="overflow-hidden rounded-b-[26px] bg-white shadow-soft">
        <div className="relative">
          <ConnectedGoogleMap title={isPartnerComing ? "Map teknisi SERJAFAN menuju customer" : "Map customer menuju titik SERJAFAN"} route={route} height={210} compact showExternal={false} />
          <Button size="icon" variant="secondary" className="absolute left-4 top-4 rounded-xl bg-white/95 shadow-soft backdrop-blur" onClick={() => onNavigate(backTarget)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="safe-x space-y-3 pt-4">
        <div className="rounded-[22px] bg-white p-4 shadow-soft">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{route.orderId ? `Order ${route.orderId}` : "Pesanan aktif"}</p>
              <h1 className="mt-1 text-lg font-black leading-tight text-navy">{isPartnerComing ? "Teknisi SERJAFAN menuju customer" : "Customer menuju titik SERJAFAN"}</h1>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{isPartnerComing ? "Navigasi teknisi internal ke alamat customer." : "Navigasi customer ke titik layanan SERJAFAN."}</p>
            </div>
            <Badge variant="orange" className="shrink-0">{partner.eta}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-[16px] bg-cloud p-1.5">
            {[
              ["PARTNER_TO_CUSTOMER", "Teknisi ke Customer"],
              ["CUSTOMER_TO_PARTNER", "Customer ke SERJAFAN"]
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTrackingMode(mode as FulfillmentMode)}
                className={cn(
                  "min-h-10 rounded-[12px] px-2 py-2 text-center text-[11px] font-extrabold leading-tight transition",
                  trackingMode === mode ? "bg-white text-flame shadow-[0_2px_10px_rgba(11,31,58,0.08)]" : "text-slate-500"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-3 grid gap-2">
            <RouteMiniCard point={route.origin} caption="Dari" />
            <RouteMiniCard point={route.destination} caption="Tujuan" active />
          </div>

          <div className="mt-4 rounded-[16px] bg-[#f7faff] p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-black">
              <span>Progress pesanan</span>
              <span className="text-[#0d47d9]">{progressPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-gradient-to-r from-[#0d47d9] to-[#ffd54a] transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="rounded-[22px] bg-white p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-navy text-sm font-extrabold text-white">MT</span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-extrabold">Teknisi SERJAFAN ditugaskan</h2>
              <p className="truncate text-xs text-slate-500">{partner.category} - dipantau operasional</p>
            </div>
            <Button size="icon" variant="navy" className="rounded-[14px]" onClick={onOpenPhone}>
              <Phone className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="orange" className="rounded-[14px]" onClick={onOpenMessages}>
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 min-[430px]:grid-cols-2">
            <a href={googleMapsDirectionsUrl(route)} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[15px] bg-navy px-4 py-3 text-center text-xs font-extrabold leading-tight text-white">
              <Navigation className="h-4 w-4" /> Lacak Teknisi SERJAFAN
            </a>
            <Button variant="outline" className="min-h-12 whitespace-normal border-2 border-navy px-3 py-3 text-center text-[11px] font-extrabold leading-tight text-navy" onClick={onOpenMessages}>
              <MessageCircle className="h-4 w-4 shrink-0" /> Chat CS
            </Button>
            <Button variant="outline" className="min-h-12 whitespace-normal border-2 border-navy px-3 py-3 text-center text-[11px] font-extrabold leading-tight text-navy" onClick={shareOrder}>
              <Upload className="h-4 w-4 shrink-0" /> Bagikan Pesanan
            </Button>
            <Button variant="outline" className="min-h-12 whitespace-normal border-2 border-navy px-3 py-3 text-center text-[11px] font-extrabold leading-tight text-navy" onClick={() => onNavigate(backTarget)}>
              <ArrowLeft className="h-4 w-4 shrink-0" /> <span className="line-clamp-2">{backLabel}</span>
            </Button>
          </div>
        </div>

        <TrackingSteps />
      </div>
    </section>
  );
}

function RouteMiniCard({ point, caption, active = false }: { point: MapPoint; caption: string; active?: boolean }) {
  const Icon = point.role === "partner" ? Bike : MapPin;
  return (
    <div className={cn("flex items-start gap-3 rounded-[16px] p-3", active ? "bg-orange-50" : "bg-cloud")}>
      <span className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] text-white", active ? "bg-flame" : "bg-navy")}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{caption}</p>
        <p className="mt-0.5 line-clamp-1 text-sm font-extrabold text-navy">{point.label}</p>
        <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-4 text-slate-500">{point.address}</p>
      </div>
    </div>
  );
}

function TrackingSteps() {
  return (
    <div className="rounded-[22px] bg-white px-4 py-5 shadow-soft">
      <div className="grid grid-cols-4">
        {[
          ["Dikonfirmasi", "done"],
          ["Teknisi Siap", "done"],
          ["Perjalanan", "active"],
          ["Selesai", "pending"]
        ].map(([label, status], index) => (
          <div key={label} className="relative text-center">
            {index < 3 && <span className={cn("absolute left-1/2 right-[-50%] top-3.5 h-0.5", status === "pending" ? "bg-slate-200" : "bg-flame")} />}
            <span
              className={cn(
                "relative z-10 mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                status === "pending" ? "bg-slate-200 text-slate-500" : "bg-flame text-white",
                status === "active" && "ring-4 ring-orange-100"
              )}
            >
              <Check className="h-3.5 w-3.5" />
            </span>
            <p className={cn("text-[9px] font-bold leading-tight", status === "pending" ? "text-slate-500" : "text-flame")}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConnectedGoogleMap({
  title,
  route,
  height = 220,
  compact = false,
  showExternal = true
}: {
  title: string;
  route: ConnectedRoute;
  height?: number;
  compact?: boolean;
  showExternal?: boolean;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const origin = mapLocationQuery(route.origin);
  const destination = mapLocationQuery(route.destination);
  const externalUrl = googleMapsDirectionsUrl(route);
  const originCaption = route.origin.role === "partner" ? "Titik Teknisi SERJAFAN" : "Titik Customer";
  const destinationCaption = route.destination.role === "partner" ? "Titik Teknisi SERJAFAN" : "Titik Customer";
  const OriginIcon = route.origin.role === "partner" ? Bike : MapPin;
  const DestinationIcon = route.destination.role === "partner" ? Bike : MapPin;
  const embedUrl = apiKey
    ? `https://www.google.com/maps/embed/v1/directions?key=${encodeURIComponent(apiKey)}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=driving`
    : null;

  return (
    <div className="overflow-hidden rounded-[18px] border border-slate-100 bg-white shadow-soft">
      <div className={cn("flex items-center justify-between gap-3 border-b border-slate-100", compact ? "px-3 py-2.5" : "px-4 py-3")}>
        <div className="min-w-0">
          <p className={cn("font-bold uppercase text-slate-500", compact ? "text-[9px]" : "text-[11px]")}>{title}</p>
          <h3 className={cn("truncate font-extrabold", compact ? "text-xs" : "text-sm")}>{route.origin.label} ke {route.destination.label}</h3>
        </div>
        <Badge variant={route.status === "PENDING" ? "warning" : "blue"} className={cn("shrink-0", compact && "px-2 text-[10px]")}>{route.eta ?? route.status ?? "Live"}</Badge>
      </div>
      {embedUrl ? (
        <iframe
          title={title}
          src={embedUrl}
          className="block w-full border-0"
          style={{ height }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : (
        <div className={cn("relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50", compact ? "p-3" : "p-4")} style={{ minHeight: height }}>
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(#cbd5e1_1px,transparent_1px),linear-gradient(90deg,#cbd5e1_1px,transparent_1px)] [background-size:34px_34px]" />
          <div className={cn("relative z-10 grid", compact ? "gap-2" : "gap-3")}>
            <div className={cn("flex min-w-0 items-start gap-3 rounded-[14px] bg-white/90 shadow-[0_2px_12px_rgba(11,31,58,0.08)]", compact ? "p-2.5" : "p-3")}>
              <span className={cn("mt-0.5 flex shrink-0 items-center justify-center rounded-xl bg-navy text-white", compact ? "h-8 w-8" : "h-9 w-9")}>
                <OriginIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("font-bold text-slate-500", compact ? "text-[10px]" : "text-[11px]")}>{originCaption}</p>
                <p className={cn("line-clamp-1 font-extrabold", compact ? "text-xs" : "text-sm")}>{route.origin.label}</p>
                <p className={cn("line-clamp-1 text-slate-500", compact ? "text-[10px]" : "text-xs")}>{route.origin.address}</p>
              </div>
            </div>
            <div className={cn("ml-[16px] w-0.5 rounded-full bg-flame", compact ? "h-4" : "h-8")} />
            <div className={cn("flex min-w-0 items-start gap-3 rounded-[14px] bg-white/90 shadow-[0_2px_12px_rgba(11,31,58,0.08)]", compact ? "p-2.5" : "p-3")}>
              <span className={cn("mt-0.5 flex shrink-0 items-center justify-center rounded-xl bg-flame text-white", compact ? "h-8 w-8" : "h-9 w-9")}>
                <DestinationIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("font-bold text-slate-500", compact ? "text-[10px]" : "text-[11px]")}>{destinationCaption}</p>
                <p className={cn("line-clamp-1 font-extrabold", compact ? "text-xs" : "text-sm")}>{route.destination.label}</p>
                <p className={cn("line-clamp-1 text-slate-500", compact ? "text-[10px]" : "text-xs")}>{route.destination.address}</p>
              </div>
            </div>
            {!compact && showExternal && (
              <p className="rounded-[12px] bg-white/85 p-3 text-xs font-semibold leading-5 text-slate-600">
                Rute ini memakai data order yang sama dengan aplikasi customer, teknisi, dan admin. Tombol Google Maps membuka navigasi asli sesuai koordinat pesanan.
              </p>
            )}
            {showExternal && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-navy px-4 py-3 text-sm font-extrabold text-white"
              >
                <Navigation className="h-4 w-4" /> Buka Google Maps
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OrdersCenter({
  orders,
  loading,
  onOpenSearch,
  onOpenTracking,
  onReview,
  onOrderNow
}: {
  orders: any[];
  loading: boolean;
  onOpenSearch: () => void;
  onOpenTracking: (order: any) => void;
  onReview: (order: any, rating: number, comment: string) => void;
  onOrderNow: () => void;
}) {
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { rating: number; comment: string }>>({});
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [orderQuery, setOrderQuery] = useState("");
  const statusFilters = [
    { label: "Semua", status: "ALL", Icon: ListOrdered },
    { label: "Menunggu", status: "PENDING", Icon: Clock },
    { label: "Diproses", status: "CONFIRMED", Icon: Wrench },
    { label: "Selesai", status: "DONE", Icon: Check },
    { label: "Dibatalkan", status: "CANCELLED", Icon: X }
  ];
  const statusTone = (status: string) => {
    if (status === "DONE") return "bg-emerald-50 text-emerald-700";
    if (status === "PENDING") return "bg-amber-50 text-amber-700";
    if (status === "CANCELLED" || status === "REJECTED") return "bg-red-50 text-red-700";
    return "bg-blue-50 text-[#075bdd]";
  };
  const statusMatchedOrders = activeStatus === "ALL" ? orders : orders.filter((order) => {
    if (activeStatus === "CONFIRMED") return !["PENDING", "DONE", "CANCELLED", "REJECTED"].includes(order.status);
    if (activeStatus === "CANCELLED") return ["CANCELLED", "REJECTED"].includes(order.status);
    return order.status === activeStatus;
  });
  const query = orderQuery.trim().toLowerCase();
  const visibleOrders = query
    ? statusMatchedOrders.filter((order) =>
        [order.id, order.partner?.category, order.partner?.name, order.addressTitle]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      )
    : statusMatchedOrders;

  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 bg-white pb-6 duration-300">
      <div className="bg-[#0648bd] px-5 pb-12 pt-5 text-white">
        <div className="flex items-center justify-between gap-4">
          <BrandMark light />
          <button type="button" className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-bold">
            <MapPin className="h-4 w-4" /> Padang <ChevronRight className="h-4 w-4 rotate-90" />
          </button>
        </div>
      </div>

      <div className="-mt-7 rounded-t-[24px] bg-white px-5 pt-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-slate-950">Pesanan Saya</h1>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onOpenSearch} className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#075bdd] shadow-[0_8px_22px_rgba(15,23,42,0.08)]">
              <Search className="h-5 w-5" />
            </button>
            <button type="button" onClick={onOrderNow} className="rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
              Pesan
            </button>
          </div>
        </div>
        <div className="mb-4 flex items-center gap-3 rounded-[16px] border border-slate-100 bg-[#f7faff] px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-[#0d47d9]" />
          <Input
            value={orderQuery}
            onChange={(event) => setOrderQuery(event.target.value)}
            placeholder="Cari nomor pesanan atau layanan"
            className="h-8 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {statusFilters.map(({ label, status, Icon }, index) => (
            <button
              key={status}
              type="button"
              onClick={() => setActiveStatus(status)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-[14px] border-2 px-4 py-3 text-xs font-black shadow-[0_6px_16px_rgba(15,23,42,0.06)]",
                activeStatus === status ? "border-[#075bdd] bg-[#075bdd] text-white" : "border-slate-100 bg-white text-slate-700"
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-[18px] bg-white p-4 shadow-soft">
          <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-20 animate-pulse rounded bg-slate-100" />
          </div>
        ) : visibleOrders.length ? (
          <div className="space-y-4">
          {visibleOrders.map((order) => (
            <div key={order.id} className="rounded-[20px] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
              <div className="flex gap-4">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-[18px] bg-[#eef5ff] text-[#075bdd]">
                  <Wrench className="h-10 w-10" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-black text-slate-950">{order.partner?.category ?? order.partner?.name ?? "Layanan SERJAFAN"}</h2>
                      <p className="mt-1 truncate text-sm font-black text-[#075bdd]">#{order.id}</p>
                    </div>
                    <span className={cn("shrink-0 rounded-[10px] px-3 py-2 text-xs font-black", statusTone(order.status))}>{order.status}</span>
                  </div>
                  <p className="mt-2 flex items-center gap-2 truncate text-sm font-semibold text-slate-500">
                    <Calendar className="h-4 w-4 shrink-0" /> {order.scheduleTitle ?? "Jadwal fleksibel"}
                  </p>
                  <p className="mt-1 flex items-center gap-2 truncate text-sm font-semibold text-slate-500">
                    <MapPin className="h-4 w-4 shrink-0" /> {order.addressTitle}
                  </p>
                  <p className="mt-3 text-right text-lg font-black text-slate-950">Rp {formatRupiah(order.total ?? 0)}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" className="flex-1 rounded-[12px] border-2 border-[#075bdd] text-[#075bdd]" disabled={order.status === "PENDING"} onClick={() => onOpenTracking(order)}>
                  Lihat Detail
                </Button>
              </div>
              {order.status === "DONE" && (
                <div className="mt-3 rounded-[14px] bg-orange-50 p-3">
                  <p className="text-xs font-extrabold text-orange-800">Isi rating dan ulasan layanan SERJAFAN</p>
                  <div className="mt-2 flex gap-1">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const value = index + 1;
                      const draft = reviewDrafts[order.id] ?? { rating: 5, comment: "" };
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setReviewDrafts((current) => ({ ...current, [order.id]: { ...draft, rating: value } }))}
                          className={cn("text-amber-500", value <= draft.rating ? "opacity-100" : "opacity-30")}
                        >
                          <Star className="h-5 w-5 fill-current" />
                        </button>
                      );
                    })}
                  </div>
                  <Input
                    className="mt-2 bg-white"
                    value={reviewDrafts[order.id]?.comment ?? ""}
                    onChange={(event) =>
                      setReviewDrafts((current) => ({ ...current, [order.id]: { rating: current[order.id]?.rating ?? 5, comment: event.target.value } }))
                    }
                    placeholder="Tulis ulasan singkat"
                  />
                  <Button
                    variant="orange"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => {
                      const draft = reviewDrafts[order.id] ?? { rating: 5, comment: "" };
                      onReview(order, draft.rating, draft.comment);
                    }}
                  >
                    <Star className="h-4 w-4" /> Kirim Rating
                  </Button>
                </div>
              )}
              {order.status === "PENDING" && <p className="mt-2 text-xs font-bold text-amber-700">Menunggu operasional SERJAFAN menugaskan teknisi.</p>}
            </div>
          ))}
          </div>
        ) : (
          <div className="rounded-[18px] bg-white p-5 text-center shadow-soft">
            <p className="text-sm font-bold">Belum ada pesanan</p>
            <p className="mt-1 text-xs text-slate-500">{orders.length ? "Tidak ada pesanan pada filter ini." : "Silakan buat pesanan baru dari layanan SERJAFAN."}</p>
            <Button variant="navy" className="mt-4" onClick={onOrderNow}>
              Pesan Sekarang
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function ProfileScreen({
  user,
  orderCount,
  onOpenOrders,
  onOpenNotifications,
  onOpenWallet,
  onOpenTopup,
  onOpenWalletHistory,
  onEditProfile,
  onLogout,
  onOpenSearch,
  onOpenMessages
}: {
  user: CurrentUser;
  orderCount: number;
  onOpenOrders: () => void;
  onOpenNotifications: () => void;
  onOpenWallet: () => void;
  onOpenTopup: () => void;
  onOpenWalletHistory: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
  onOpenSearch: () => void;
  onOpenMessages: () => void;
}) {
  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "SF";
  const profileActions = [
    { icon: Wallet, label: "Top Up Saldo", onClick: onOpenTopup },
    { icon: ListOrdered, label: "Riwayat Saldo", onClick: onOpenWalletHistory },
    { icon: ShoppingBag, label: "Riwayat Pesanan", onClick: onOpenOrders },
    { icon: Wallet, label: "Pembayaran Saya", onClick: onOpenWallet },
    { icon: MapPin, label: "Alamat Saya", onClick: onEditProfile },
    { icon: Tag, label: "Kupon Saya", onClick: onOpenNotifications },
    { icon: Heart, label: "Favorit Layanan", onClick: onOpenSearch },
    { icon: Star, label: "Ulasan Saya", onClick: onOpenOrders }
  ];
  const supportActions = [
    { icon: MessageCircle, label: "Pusat Bantuan", onClick: onOpenMessages },
    { icon: Phone, label: "Hubungi Kami", onClick: onOpenMessages },
    { icon: ShieldCheck, label: "Tentang SERJAFAN", onClick: onOpenNotifications },
    { icon: ShieldCheck, label: "Kebijakan Privasi", onClick: () => { window.location.href = "/privacy"; } },
    { icon: ListOrdered, label: "Syarat & Ketentuan", onClick: () => { window.location.href = "/terms"; } }
  ];

  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 bg-white pb-6 duration-300">
      <div className="bg-[#0648bd] px-5 pb-24 pt-5 text-white">
        <div className="flex items-center justify-between gap-4">
          <BrandMark light />
          <button type="button" className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-bold">
            <MapPin className="h-4 w-4" /> Padang <ChevronRight className="h-4 w-4 rotate-90" />
          </button>
        </div>
        <div className="mt-7 flex items-center justify-between">
          <h1 className="text-2xl font-black">Akun Saya</h1>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onOpenNotifications} className="relative rounded-full bg-white/10 p-2.5">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black">3</span>
            </button>
          </div>
        </div>
      </div>

      <div className="-mt-16 px-5">
        <div className="overflow-hidden rounded-[20px] bg-white shadow-[0_12px_34px_rgba(15,23,42,0.12)]">
          <div className="flex items-start gap-4 p-4">
            {user.image ? (
              <img src={user.image} alt={user.name} className="h-20 w-20 rounded-full border-4 border-[#eef5ff] object-cover" />
            ) : (
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-[#eef5ff] bg-[#eaf2ff] text-xl font-black text-[#075bdd]">{initials}</span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-black text-slate-950">{user.name}</h2>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-500">{user.phone || "Nomor HP belum diatur"}</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-500">Akun Customer SERJAFAN</p>
                  <p className="mt-2 flex items-center gap-1 truncate text-xs font-bold text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-[#075bdd]" /> {user.location}
                  </p>
                </div>
                <button type="button" onClick={onEditProfile} className="shrink-0 rounded-[12px] bg-[#eef5ff] px-3 py-2 text-xs font-black text-[#075bdd]">
                  Edit Profil
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 border-t border-slate-100">
            {[
              { icon: ShoppingBag, value: String(orderCount), label: "Pesanan" },
              { icon: Star, value: orderCount ? "Aktif" : "Baru", label: "Status" },
              { icon: Wallet, value: `Rp ${formatRupiah(user.walletBalance)}`, label: "Saldo" },
              { icon: Tag, value: "Admin", label: "Promo" }
            ].map(({ icon: Icon, value, label }) => (
              <button key={label} type="button" onClick={label === "Saldo" ? onOpenWallet : onOpenOrders} className="min-w-0 border-r border-slate-100 px-2 py-4 text-center last:border-r-0">
                <Icon className="mx-auto h-5 w-5 text-[#075bdd]" />
                <p className="mt-2 truncate text-sm font-black text-slate-950">{value}</p>
                <p className="mt-1 truncate text-[10px] font-semibold text-slate-500">{label}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-[18px] bg-[#eef5ff] p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#075bdd] text-white">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-black text-slate-950">Jadi Member SERJAFAN</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Dapatkan diskon, cashback, dan berbagai keuntungan lainnya.</p>
            </div>
          </div>
          <button type="button" onClick={onOpenTopup} className="shrink-0 rounded-[12px] bg-[#075bdd] px-3 py-2 text-xs font-black text-white">
            Gabung
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-[18px] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
          {profileActions.map((item) => (
            <ProfileAction key={item.label} icon={item.icon} label={item.label} onClick={item.onClick} />
          ))}
        </div>
        <div className="mt-4 overflow-hidden rounded-[18px] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
          {supportActions.map((item) => (
            <ProfileAction key={item.label} icon={item.icon} label={item.label} onClick={item.onClick} />
          ))}
        </div>
        <button type="button" onClick={onLogout} className="mt-5 flex w-full items-center justify-center gap-2 rounded-[18px] bg-white p-4 text-sm font-black text-red-600 shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
          <LogIn className="h-5 w-5 rotate-180" /> Keluar dari Akun
        </button>
      </div>
    </section>
  );
}

function ProfileAction({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between border-b border-slate-100 bg-white p-4 text-left last:border-b-0">
      <span className="flex items-center gap-3 text-sm font-extrabold text-slate-800">
        <Icon className="h-5 w-5 text-[#075bdd]" /> {label}
      </span>
      <ChevronRight className="h-4 w-4 text-slate-400" />
    </button>
  );
}

function WalletScreen({
  user,
  onBack,
  onOpenTopup,
  onOpenHistory
}: {
  user: CurrentUser;
  onBack: () => void;
  onOpenTopup: () => void;
  onOpenHistory: () => void;
}) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 p-5 duration-300">
      <div className="mb-4 flex items-center gap-3">
        <Button size="icon" variant="secondary" className="rounded-[10px]" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-extrabold">Dompet</h1>
      </div>
      <div className="overflow-hidden rounded-[22px] bg-gradient-to-br from-navy via-[#12365f] to-flame p-5 text-white shadow-soft">
        <p className="text-xs font-bold text-white/75">Saldo SERJAFAN Pay</p>
        <p className="mt-1 text-3xl font-extrabold">Rp {formatRupiah(user.walletBalance)}</p>
        <div className="mt-5 flex items-center justify-between rounded-[16px] bg-white/10 p-3">
          <span className="text-xs font-bold text-white/70">IDR wallet</span>
          <span className="flex items-center gap-1 text-xs font-extrabold"><ShieldCheck className="h-4 w-4" /> Protected</span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="navy" onClick={onOpenHistory}>
          <ListOrdered className="h-4 w-4" /> Riwayat
        </Button>
        <Button variant="orange" onClick={onOpenTopup}>
          <Wallet className="h-4 w-4" /> Top Up
        </Button>
      </div>
      <div className="mt-4 rounded-[16px] bg-white p-4 shadow-soft">
        <p className="text-sm font-extrabold">Standar produksi</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">Top up, pembayaran pesanan, dan riwayat transaksi membaca saldo yang sama dari database akun customer.</p>
      </div>
    </section>
  );
}

function TopUpScreen({
  mode = "customer",
  balance,
  onBack,
  onSubmit,
  settings
}: {
  mode?: "customer" | "partner";
  balance: number;
  onBack: () => void;
  onSubmit: (amount: number, method: string, meta?: ManualTopUpMeta) => Promise<void>;
  settings: AdminSettings;
}) {
  const isPartnerTopUp = mode === "partner";
  const [amount, setAmount] = useState(isPartnerTopUp ? "20000" : "100000");
  const [method, setMethod] = useState("Transfer Bank Admin");
  const [senderName, setSenderName] = useState("");
  const [reference, setReference] = useState("");
  const [proofImage, setProofImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const numericAmount = Number(amount.replace(/\D/g, "") || 0);
  const fee = 0;
  const quickAmounts = isPartnerTopUp ? [20000, 50000, 100000, 250000] : [50000, 100000, 250000, 500000];
  const paymentChannels = ["Transfer Bank Admin", "DANA Admin"];
  const destination = method.includes("DANA")
    ? {
        title: "Nomor DANA Admin",
        primary: settings.manualDanaNumber || "Nomor DANA belum diisi admin",
        secondary: `Atas nama ${settings.manualDanaName || "akun DANA admin"}`
      }
    : {
        title: "Rekening Bank Admin",
        primary: settings.manualBankAccount || "Nomor rekening belum diisi admin",
        secondary: `${settings.manualBankName || "Bank admin"} - ${settings.manualBankHolder || "SERJAFAN"}`
      };
  const minimumAmount = isPartnerTopUp ? 20000 : 10000;

  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 p-5 duration-300">
      <div className="mb-4 flex items-center gap-3">
        <Button size="icon" variant="secondary" className="rounded-[10px]" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-extrabold">{isPartnerTopUp ? "Top Up Deposit Teknisi" : "Top Up"}</h1>
      </div>
      <div className="mb-3 rounded-[16px] border border-amber-200 bg-amber-50 p-3 text-[11px] font-bold leading-5 text-amber-800">
        Transfer tidak dilakukan di dalam aplikasi SERJAFAN. Aplikasi hanya menampilkan nomor rekening/DANA admin, lalu pengguna transfer dari aplikasi bank/DANA sendiri dan upload screenshot bukti transfer di sini.
      </div>
      <div className="mb-3 rounded-[16px] bg-navy p-4 text-white shadow-soft">
        <p className="text-xs font-bold text-white/60">Saldo saat ini</p>
        <p className="mt-1 text-2xl font-extrabold">Rp {formatRupiah(balance)}</p>
      </div>
      <div className="space-y-3 rounded-[16px] bg-white p-4 shadow-soft">
        <Input value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))} placeholder="Nominal top up" inputMode="numeric" />
        <div className="grid grid-cols-4 gap-2">
          {quickAmounts.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAmount(String(value))}
              className={cn("rounded-[12px] border px-2 py-2 text-[11px] font-extrabold", numericAmount === value ? "border-flame bg-orange-50 text-flame" : "border-slate-100 text-slate-500")}
            >
              {formatRupiah(value / 1000)}rb
            </button>
          ))}
        </div>
        <div>
          <p className="mb-2 text-xs font-extrabold uppercase text-slate-500">Metode top up</p>
          <div className="grid grid-cols-2 gap-2">
            {paymentChannels.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMethod(item)}
              className={cn("rounded-[12px] border-2 p-3 text-xs font-extrabold", method === item ? "border-flame bg-orange-50 text-flame" : "border-slate-100 bg-white text-slate-500")}
            >
              {item}
            </button>
            ))}
          </div>
        </div>
        <div className="rounded-[16px] border-2 border-flame bg-orange-50 p-4">
          <p className="text-[11px] font-extrabold uppercase text-flame">{destination.title}</p>
          <p className="mt-2 break-words text-lg font-extrabold text-navy">{destination.primary}</p>
          <p className="mt-1 text-xs font-bold text-slate-600">{destination.secondary}</p>
          <p className="mt-3 text-[11px] font-bold leading-5 text-amber-800">
            Transfer hanya ke tujuan ini. Nomor rekening/DANA ini diambil otomatis dari pengaturan admin.
          </p>
        </div>
        <div className="rounded-[14px] border border-amber-200 bg-amber-50 p-3 text-[11px] font-bold leading-5 text-amber-800">
          {isPartnerTopUp
            ? "Saldo teknisi baru aktif setelah admin melihat uang masuk, bukti transfer lengkap, dan menekan Setujui. Minimal Rp 20.000 agar bisa menerima tugas SERJAFAN."
            : "Saldo customer baru masuk setelah admin melihat uang masuk, bukti transfer lengkap, dan menekan Setujui. Setelah saldo masuk, pembayaran pesanan SERJAFAN Pay akan terpotong otomatis sesuai total jasa."}
        </div>
        <div className="grid gap-2 rounded-[14px] bg-slate-50 p-3">
          <p className="text-xs font-extrabold uppercase text-slate-500">Data transfer manual</p>
          <Input value={senderName} onChange={(event) => setSenderName(event.target.value)} placeholder="Nama pengirim di rekening/DANA" />
          <Input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="No. referensi/catatan transfer" />
          <AuthPhotoField label="Screenshot Bukti Transfer (Wajib)" required value={proofImage} onChange={setProofImage} />
        </div>
        <div className="rounded-[14px] bg-slate-50 p-3 text-xs">
          <div className="flex justify-between text-slate-500"><span>Nominal</span><span>Rp {formatRupiah(numericAmount)}</span></div>
          <div className="mt-1 flex justify-between text-slate-500"><span>Biaya kanal</span><span>Rp {formatRupiah(fee)}</span></div>
          <div className="mt-2 flex justify-between font-extrabold text-navy"><span>Total bayar</span><span>Rp {formatRupiah(numericAmount + fee)}</span></div>
        </div>
        <Button
          variant="orange"
          className="w-full"
          disabled={submitting || numericAmount < minimumAmount || !proofImage}
          onClick={async () => {
            setSubmitting(true);
            await onSubmit(numericAmount, method, { senderName, reference, proofImage });
            setSubmitting(false);
          }}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />} Top Up Rp {formatRupiah(numericAmount)}
        </Button>
      </div>
    </section>
  );
}

function CustomerAccessScreen({
  user,
  onSubmit
}: {
  user: CurrentUser;
  onSubmit: (profile: { name: string; phone: string; location: string; profilePhoto?: string | null }) => Promise<void>;
}) {
  const [name, setName] = useState(user.name === "Customer" ? "" : user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [address, setAddress] = useState(user.location === "Kota Padang" ? "" : user.location);
  const [submitting, setSubmitting] = useState(false);
  const addressReady = address.trim().length >= 12 && address.trim().toLowerCase() !== "kota padang";

  return (
    <section className="safe-x animate-in fade-in slide-in-from-bottom-3 py-5 duration-300">
      <div className="overflow-hidden rounded-[24px] bg-white shadow-soft">
        <div className="bg-navy px-5 py-5 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12">
              <MapPin className="h-6 w-6 text-flame" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-white/55">Akses Customer</p>
              <h1 className="text-xl font-black leading-tight">Lengkapi Data Pelanggan</h1>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-white/75">
            Tidak perlu daftar atau login. Isi data ini satu kali agar SERJAFAN bisa menghubungi Anda dan alamat pesanan terbaca di maps.
          </p>
        </div>

        <div className="space-y-3 p-4">
          <div>
            <label className="mb-1.5 block text-xs font-extrabold uppercase text-slate-500">Nama lengkap</label>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Contoh: Rahmad Irfan" autoComplete="name" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-extrabold uppercase text-slate-500">Nomor HP aktif</label>
            <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Contoh: 0838xxxx5679" inputMode="tel" autoComplete="tel" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-extrabold uppercase text-slate-500">Alamat lengkap untuk maps</label>
            <textarea
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Contoh: Jl. Gajah Mada No. 10, Gunung Pangilun, Padang Utara, Kota Padang, Sumatera Barat"
              className="min-h-[116px] w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold leading-6 outline-none transition focus:border-flame focus:bg-white focus:ring-4 focus:ring-orange-100"
              autoComplete="street-address"
            />
            <p className={cn("mt-2 text-xs font-bold", addressReady ? "text-emerald-600" : "text-slate-500")}>
              {addressReady ? "Alamat siap dipakai untuk pesanan dan tracking." : "Tulis alamat lengkap, bukan hanya nama kota."}
            </p>
          </div>

          <Button
            variant="orange"
            className="h-12 w-full rounded-2xl text-sm font-black"
            disabled={submitting || !name.trim() || !phone.trim() || !addressReady}
            onClick={async () => {
              setSubmitting(true);
              try {
                await onSubmit({ name, phone, location: address });
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Simpan dan Masuk Customer
          </Button>
        </div>
      </div>
    </section>
  );
}

function EditProfileScreen({
  user,
  onBack,
  onSubmit
}: {
  user: CurrentUser;
  onBack: () => void;
  onSubmit: (profile: { name: string; phone: string; location: string; profilePhoto?: string | null }) => Promise<void>;
}) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [city, setCity] = useState(user.location);
  const [profilePhoto, setProfilePhoto] = useState(user.image || "");
  const [submitting, setSubmitting] = useState(false);

  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 p-5 duration-300">
      <div className="mb-4 flex items-center gap-3">
        <Button size="icon" variant="secondary" className="rounded-[10px]" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-extrabold">Edit Profil</h1>
      </div>
      <div className="space-y-3 rounded-[16px] bg-white p-4 shadow-soft">
        <AuthPhotoField label="Foto Profil" value={profilePhoto} onChange={setProfilePhoto} />
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama lengkap" />
        <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Nomor HP" />
        <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Kota" />
        <Button
          variant="orange"
          className="w-full"
          disabled={submitting || !name.trim() || !phone.trim() || !city.trim()}
          onClick={async () => {
            setSubmitting(true);
            await onSubmit({ name, phone, location: city, profilePhoto: profilePhoto || null });
            setSubmitting(false);
          }}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Simpan Profil
        </Button>
      </div>
    </section>
  );
}

function WalletHistoryScreen({ transactions, onBack }: { transactions: WalletTransaction[]; onBack: () => void }) {
  const income = transactions.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0);
  const expense = transactions.filter((item) => item.amount < 0).reduce((sum, item) => sum + Math.abs(item.amount), 0);

  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 p-5 duration-300">
      <div className="mb-4 flex items-center gap-3">
        <Button size="icon" variant="secondary" className="rounded-[10px]" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-extrabold">Riwayat Transaksi</h1>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-[16px] bg-emerald-50 p-3">
          <p className="text-[10px] font-bold uppercase text-emerald-700">Uang masuk</p>
          <p className="mt-1 text-sm font-extrabold text-emerald-800">Rp {formatRupiah(income)}</p>
        </div>
        <div className="rounded-[16px] bg-red-50 p-3">
          <p className="text-[10px] font-bold uppercase text-red-700">Uang keluar</p>
          <p className="mt-1 text-sm font-extrabold text-red-800">Rp {formatRupiah(expense)}</p>
        </div>
      </div>
      <div className="space-y-2">
        {transactions.length ? (
          transactions.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-[14px] bg-white p-4 shadow-soft">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold">{item.description}</p>
                <p className="text-xs text-slate-500">
                  {item.type} - {item.createdAt ? new Date(item.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "Baru saja"}
                </p>
              </div>
              <span className={cn("ml-3 shrink-0 text-sm font-extrabold", item.amount < 0 ? "text-red-600" : "text-emerald-600")}>
                {item.amount < 0 ? "-" : "+"}Rp {formatRupiah(Math.abs(item.amount))}
              </span>
            </div>
          ))
        ) : (
          <div className="rounded-[14px] bg-white p-4 text-sm text-slate-500 shadow-soft">Belum ada transaksi.</div>
        )}
      </div>
    </section>
  );
}

function PartnerApp({
  onNavigate,
  online,
  setOnline,
  orderDraft,
  orders,
  loading,
  onAcceptOrder,
  onRejectOrder,
  onUpdateOrderStatus,
  onOpenTracking,
  onOpenMessages,
  onOpenNotificationSettings,
  onOpenPhone,
  onOpenAccount,
  partnerSelf,
  walletBalance,
  featureCopy,
  onOpenTopup
}: {
  onNavigate: (screen: Screen) => void;
  online: boolean;
  setOnline: (online: boolean) => void;
  orderDraft: OrderDraft;
  orders: any[];
  loading: boolean;
  onAcceptOrder: (id: string) => Promise<any | null>;
  onRejectOrder: (id: string) => Promise<boolean>;
  onUpdateOrderStatus: (id: string, status: "ON_THE_WAY" | "IN_PROGRESS" | "COMPLETED") => Promise<void>;
  onOpenTracking: (order: any) => void;
  onOpenMessages: () => void;
  onOpenNotificationSettings: () => void;
  onOpenPhone: () => void;
  onOpenAccount: () => void;
  partnerSelf: Partner;
  walletBalance: number;
  featureCopy: AdminConsoleData["settings"]["partnerFeatureCopy"];
  onOpenTopup: () => void;
}) {
  const incomingOrders = orders.filter((order) => order.status === "PENDING" || order.status === "CONFIRMED");
  const activeOrders = orders.filter((order) => order.status !== "PENDING" && order.status !== "CONFIRMED" && order.status !== "CANCELLED" && order.status !== "DONE");

  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="rounded-b-[28px] bg-gradient-to-br from-navy to-[#1a3a6e] px-4 pb-6 pt-4 text-white sm:px-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-3">
            <p className="text-[11px] font-bold text-white/70">TEKNISI DASHBOARD</p>
            <h1 className="mt-1 truncate text-lg font-extrabold">{featureCopy.headline?.trim() || "Akun Teknisi"}</h1>
            {featureCopy.description?.trim() && <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-4 text-white/70">{featureCopy.description}</p>}
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white/15 text-sm font-extrabold">TS</span>
        </div>
        <div className="flex items-start gap-3">
          <Switch checked={online && walletBalance >= 20000} onCheckedChange={setOnline} />
          <span className="text-balance-mobile text-[13px] font-bold leading-5">
            {walletBalance >= 20000 ? (online ? "Online - Siap Menerima Tugas" : "Offline - Tidak Menerima Tugas") : "Deposit kurang - Top up minimal Rp 20.000"}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 min-[380px]:grid-cols-4">
          <Button variant="outline" size="sm" className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={onOpenMessages}>
            <MessageCircle className="h-4 w-4" /> Pesan
          </Button>
          <Button variant="outline" size="sm" className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={onOpenNotificationSettings}>
            <Bell className="h-4 w-4" /> Nada
          </Button>
          <Button variant="outline" size="sm" className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={onOpenPhone}>
            <Phone className="h-4 w-4" /> Telepon
          </Button>
          <Button variant="outline" size="sm" className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={onOpenAccount}>
            <UserCircle className="h-4 w-4" /> Akun
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {[
            ["Penghasilan Hari Ini", "Rp 185.000"],
            ["Pesanan Selesai", "12 Pesanan"],
            ["Rating Bulan Ini", "4.9"],
            ["Saldo Dompet", `Rp ${formatRupiah(walletBalance)}`]
          ].map(([label, value]) => (
            <div key={label} className="rounded-[16px] border border-white/10 bg-white/10 p-3.5">
              <p className="text-[11px] text-white/70">{label}</p>
              <p className="mt-1 text-lg font-extrabold">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2">
          <Button variant="outline" size="sm" className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={onOpenTopup}>
            <Wallet className="h-4 w-4" /> Top Up Deposit
          </Button>
        </div>
      </div>

      <Section title="Deposit Kerja Teknisi" action={walletBalance >= 20000 ? "Aktif" : "Wajib Top Up"}>
        <div className="rounded-[20px] bg-white p-4 shadow-soft">
          <div className="mb-3 flex items-start gap-3">
            <span className={cn("flex h-11 w-11 items-center justify-center rounded-[14px]", walletBalance >= 20000 ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-flame")}>
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-extrabold">{walletBalance >= 20000 ? "Teknisi bisa menerima tugas SERJAFAN" : "Top up minimal Rp 20.000"}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Teknisi yang saldo depositnya kurang dari Rp 20.000 otomatis tidak menerima penugasan SERJAFAN.
              </p>
            </div>
          </div>
          <div className={cn("mt-3 rounded-[14px] p-3 text-xs font-bold", walletBalance >= 20000 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
            Deposit kerja: Rp {formatRupiah(walletBalance)}. Minimal Rp 20.000 agar teknisi bisa menerima tugas operasional.
          </div>
          {walletBalance < 20000 && (
            <Button variant="orange" className="mt-3 w-full" onClick={onOpenTopup}>
              <Wallet className="h-4 w-4" /> Top Up Deposit Sekarang
            </Button>
          )}
        </div>
      </Section>

      <Section title="Pesanan Masuk" action={`${incomingOrders.length} Baru`}>
        {loading ? (
          <div className="rounded-[20px] bg-white p-4 shadow-soft">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-24 animate-pulse rounded bg-slate-100" />
          </div>
        ) : incomingOrders.length ? (
          incomingOrders.map((order) => (
            <div key={order.id} className="rounded-[18px] border-l-4 border-flame bg-white p-3.5 shadow-soft">
              <div className="mb-1.5 flex items-start justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-[13px] font-extrabold">
                  <KeyRound className="h-4 w-4 shrink-0 text-flame" /> <span className="truncate">{order.serviceCategoryId}</span>
                </span>
                <span className="shrink-0 text-[13px] font-extrabold text-flame">Rp {formatRupiah(order.total ?? orderDraft.serviceFee)}</span>
              </div>
              <p className="mb-3 line-clamp-2 text-xs leading-5 text-slate-500">{order.addressTitle}, {order.addressSubtitle}</p>
              <div className="mb-3">
                <ConnectedGoogleMap title="Rute Pesanan Masuk" route={routeForOrder(order, partnerSelf)} height={176} compact showExternal={false} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-2 border-red-600 text-red-600" onClick={() => onRejectOrder(order.id)}>
                  <X className="h-4 w-4" /> Tolak
                </Button>
                <Button variant="orange" className="flex-[2]" onClick={() => {
                  void (async () => {
                    const acceptedOrder = await onAcceptOrder(order.id);
                    if (acceptedOrder) onNavigate("tracking");
                  })();
                }}>
                  <Check className="h-4 w-4" /> Terima Pesanan
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[16px] bg-white p-4 text-sm text-slate-500 shadow-soft">Tidak ada pesanan masuk.</div>
        )}
      </Section>

      <Section title="Pesanan Aktif">
        {activeOrders.length ? (
          activeOrders.map((order) => (
            <div key={order.id} className="mb-3 rounded-[18px] bg-white p-3.5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold text-slate-500">{order.customerId}</p>
                  <h3 className="line-clamp-1 text-sm font-extrabold">{order.addressTitle}</h3>
                  <p className="line-clamp-1 text-xs text-slate-500">{order.note ?? "Tanpa catatan"}</p>
                </div>
                <Badge variant="blue">{order.status}</Badge>
              </div>
              <div className="mt-3">
                <ConnectedGoogleMap title="Rute Aktif Teknisi" route={routeForOrder(order, partnerSelf)} height={176} compact showExternal={false} />
              </div>
              <Button variant="navy" className="mt-3 w-full" onClick={() => onOpenTracking(order)}>
                <Navigation className="h-4 w-4" /> Buka Map & Navigasi Pesanan
              </Button>
              <div className="mt-3 grid grid-cols-1 gap-2 min-[380px]:grid-cols-3">
                <Button variant="outline" className="border-2 border-navy text-xs text-navy" onClick={() => void onUpdateOrderStatus(order.id, "ON_THE_WAY")}>
                  Berangkat
                </Button>
                <Button variant="outline" className="border-2 border-navy text-xs text-navy" onClick={() => void onUpdateOrderStatus(order.id, "IN_PROGRESS")}>
                  Mulai Kerja
                </Button>
                <Button variant="orange" className="text-xs" onClick={() => void onUpdateOrderStatus(order.id, "COMPLETED")}>
                  Selesai
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[16px] bg-white p-4 text-sm text-slate-500 shadow-soft">Belum ada pesanan aktif.</div>
        )}
      </Section>

      <Section title="Performa Saya">
        <Card className="rounded-[20px] border-slate-100">
          <CardContent>
            <h2 className="text-[13px] font-extrabold">Rating & Ulasan</h2>
            <div className="mt-2 flex gap-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-500">4.9 dari 5.0 - 287 ulasan</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Teknisi Andalan", "Respon Cepat", "100% Hadir", "Premium"].map((badge) => (
                <Badge key={badge} variant="secondary" className="rounded-[10px]">
                  {badge}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </Section>
    </section>
  );
}

function PartnerAccountScreen({
  orders,
  walletBalance,
  profile,
  onBack,
  onOpenMessages,
  onOpenPhone,
  onOpenTopup,
  onSavePayments
}: {
  orders: any[];
  walletBalance: number;
  profile: any | null;
  onBack: () => void;
  onOpenMessages: () => void;
  onOpenPhone: () => void;
  onOpenTopup: () => void;
  onSavePayments: (payments: {
    paymentBankName: string;
    paymentBankAccount: string;
    paymentBankHolder: string;
    paymentDanaNumber: string;
    paymentDanaName: string;
    acceptsCash: boolean;
  }) => Promise<boolean>;
}) {
  const doneOrders = orders.filter((order) => order.status === "DONE").length;
  const activeOrders = orders.filter((order) => !["PENDING", "CANCELLED", "DONE"].includes(order.status)).length;
  const [payments, setPayments] = useState({
    paymentBankName: profile?.paymentBankName ?? "",
    paymentBankAccount: profile?.paymentBankAccount ?? "",
    paymentBankHolder: profile?.paymentBankHolder ?? "",
    paymentDanaNumber: profile?.paymentDanaNumber ?? "",
    paymentDanaName: profile?.paymentDanaName ?? "",
    acceptsCash: profile?.acceptsCash !== false
  });
  const [hasLocalPaymentEdits, setHasLocalPaymentEdits] = useState(false);
  const [savingPayments, setSavingPayments] = useState(false);
  const loadedPaymentProfileKey = useRef("");

  useEffect(() => {
    const profileKey = [
      profile?.id ?? "empty",
      profile?.updatedAt ?? "",
      profile?.paymentBankName ?? "",
      profile?.paymentBankAccount ?? "",
      profile?.paymentBankHolder ?? "",
      profile?.paymentDanaNumber ?? "",
      profile?.paymentDanaName ?? "",
      String(profile?.acceptsCash !== false)
    ].join("|");
    if (hasLocalPaymentEdits || loadedPaymentProfileKey.current === profileKey) return;
    setPayments({
      paymentBankName: profile?.paymentBankName ?? "",
      paymentBankAccount: profile?.paymentBankAccount ?? "",
      paymentBankHolder: profile?.paymentBankHolder ?? "",
      paymentDanaNumber: profile?.paymentDanaNumber ?? "",
      paymentDanaName: profile?.paymentDanaName ?? "",
      acceptsCash: profile?.acceptsCash !== false
    });
    loadedPaymentProfileKey.current = profileKey;
  }, [hasLocalPaymentEdits, profile]);
  const updatePaymentField = (patch: Partial<typeof payments>) => {
    setHasLocalPaymentEdits(true);
    setPayments((current) => ({ ...current, ...patch }));
  };
  const submitPaymentData = async () => {
    if (!directPaymentReady || savingPayments) return;
    setSavingPayments(true);
    const saved = await onSavePayments(payments);
    if (saved) {
      setHasLocalPaymentEdits(false);
      loadedPaymentProfileKey.current = "";
    }
    setSavingPayments(false);
  };
  const bankReady = Boolean(cleanText(payments.paymentBankName) && cleanText(payments.paymentBankAccount) && cleanText(payments.paymentBankHolder));
  const danaReady = Boolean(cleanText(payments.paymentDanaNumber) && cleanText(payments.paymentDanaName));
  const directPaymentReady = bankReady || danaReady;

  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 p-5 duration-300">
      <div className="mb-4 flex items-center gap-3">
        <Button size="icon" variant="secondary" className="rounded-[10px]" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-extrabold">Akun Teknisi</h1>
          <p className="text-xs text-slate-500">Data teknisi jaringan dan aktivitas layanan SERJAFAN.</p>
        </div>
      </div>

      <div className="rounded-[18px] bg-navy p-5 text-white shadow-soft">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-white/15 text-sm font-extrabold">TS</span>
          <div>
            <h2 className="text-lg font-extrabold">Teknisi SERJAFAN</h2>
            <p className="text-xs text-white/65">Profil teknisi aktif setelah registrasi disetujui admin.</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          ["Status Dokumen", "Terverifikasi"],
          ["Rating", "4.9 / 5.0"],
          ["Pesanan Aktif", `${activeOrders}`],
          ["Pesanan Selesai", `${doneOrders}`],
          ["Area Layanan", "Kota Padang"],
          ["Saldo Teknisi", `Rp ${formatRupiah(walletBalance)}`]
        ].map(([label, value]) => (
          <div key={label} className="rounded-[14px] bg-white p-4 shadow-soft">
            <p className="text-[11px] font-bold text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-extrabold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2">
        <Button variant="outline" className="justify-start border-2 border-navy text-navy" onClick={onOpenTopup}>
          <Wallet className="h-4 w-4" /> Top Up Deposit Teknisi
        </Button>
        <Button variant="outline" className="justify-start border-2 border-navy text-navy" onClick={onOpenMessages}>
          <MessageCircle className="h-4 w-4" /> Menu Pesan Operasional
        </Button>
        <Button variant="outline" className="justify-start border-2 border-navy text-navy" onClick={onOpenPhone}>
          <Phone className="h-4 w-4" /> Menu Telepon Operasional
        </Button>
        <Button variant="orange" onClick={onBack}>
          Kembali ke Dashboard Teknisi
        </Button>
      </div>

      <div className="mt-4 rounded-[18px] bg-white p-4 shadow-soft">
        <p className="text-sm font-extrabold">Data Pembayaran Teknisi</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Data ini dipantau admin SERJAFAN untuk verifikasi operasional dan payout. Minimal isi satu metode lengkap sebelum teknisi bisa online menerima tugas.
        </p>
        <div className="mt-3 grid gap-2">
          <Input value={payments.paymentBankName} onChange={(event) => updatePaymentField({ paymentBankName: event.target.value })} placeholder="Nama bank teknisi, contoh: Bank Nagari" />
          <Input value={payments.paymentBankAccount} onChange={(event) => updatePaymentField({ paymentBankAccount: event.target.value })} placeholder="Nomor rekening teknisi" inputMode="numeric" />
          <Input value={payments.paymentBankHolder} onChange={(event) => updatePaymentField({ paymentBankHolder: event.target.value })} placeholder="Nama pemilik rekening" />
          <Input value={payments.paymentDanaNumber} onChange={(event) => updatePaymentField({ paymentDanaNumber: event.target.value })} placeholder="Nomor DANA teknisi" inputMode="tel" />
          <Input value={payments.paymentDanaName} onChange={(event) => updatePaymentField({ paymentDanaName: event.target.value })} placeholder="Nama akun DANA teknisi" />
          <div className="flex items-center justify-between rounded-[14px] bg-cloud p-3">
            <div>
              <p className="text-xs font-extrabold">Terima pembayaran cash</p>
              <p className="text-[11px] text-slate-500">Admin dapat mencatat pembayaran tunai sesuai operasional.</p>
            </div>
            <Switch checked={payments.acceptsCash} onCheckedChange={(acceptsCash) => updatePaymentField({ acceptsCash })} />
          </div>
          {!directPaymentReady && (
            <p className="rounded-[12px] bg-red-50 p-3 text-xs font-bold leading-5 text-red-600">
              Lengkapi salah satu: nama bank + nomor rekening + nama pemilik, atau nomor DANA + nama akun DANA.
            </p>
          )}
          <Button variant="orange" disabled={!directPaymentReady || savingPayments} onClick={() => void submitPaymentData()}>
            {savingPayments ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {savingPayments ? "Menyimpan..." : "Simpan Data Pembayaran"}
          </Button>
        </div>
      </div>
    </section>
  );
}

function AdminDashboard({
  dashboard,
  liveOrders,
  mapData,
  consoleData,
  walletData,
  auditData,
  pendingPartners,
  settings,
  loading,
  onReviewPartner,
  onSaveSettings,
  onSaveConsole,
  onUpdateCustomer,
  onDeleteCustomer,
  onUpdatePartner,
  onDeletePartner,
  onAdjustWallet,
  onOpenMessages,
  onOpenNotificationSettings
}: {
  dashboard: { revenueMonth: number; totalOrders: number; activePartners: number; activeCustomers: number } | null;
  liveOrders: any[];
  mapData: AdminMapData;
  consoleData: AdminConsoleData;
  walletData: AdminWalletData;
  auditData: AdminAuditData;
  pendingPartners: any[];
  settings: AdminSettings;
  loading: boolean;
  onReviewPartner: (partnerId: string, action: "approve" | "reject") => Promise<void>;
  onSaveSettings: (settings: AdminSettings) => Promise<void>;
  onSaveConsole: (settings: AdminConsoleData["settings"]) => Promise<void>;
  onUpdateCustomer: (customerId: string, payload: any) => Promise<void>;
  onDeleteCustomer: (customerId: string) => Promise<void>;
  onUpdatePartner: (partnerId: string, payload: any) => Promise<void>;
  onDeletePartner: (partnerId: string) => Promise<void>;
  onAdjustWallet: (payload: { userId?: string; amount?: number; description: string; action?: "ADJUST" | "APPROVE_TOPUP" | "REJECT_TOPUP"; paymentIntentId?: string }) => void;
  onOpenMessages: () => void;
  onOpenNotificationSettings: () => void;
}) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="safe-x flex items-center justify-between gap-3 bg-navy py-4 text-white">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-white/60">SERJAFAN ADMIN</p>
          <h1 className="truncate text-base font-extrabold">Dashboard Utama</h1>
        </div>
        <Badge className="shrink-0 rounded-md bg-flame text-white">Super Admin</Badge>
      </div>

      <div className="px-4 pt-4 sm:px-5">
        <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
          <Button variant="outline" className="border-2 border-navy text-navy" onClick={onOpenMessages}>
            <MessageCircle className="h-4 w-4" /> Pesan
          </Button>
          <Button variant="outline" className="border-2 border-flame text-flame" onClick={onOpenNotificationSettings}>
            <Bell className="h-4 w-4" /> Nada Dering
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 p-4 min-[380px]:grid-cols-2 sm:p-5">
        {[
          ["Revenue Bulan Ini", `Rp ${formatRupiah(dashboard?.revenueMonth ?? 128000000)}`, "+24.5% vs bulan lalu"],
          ["Total Pesanan", `${dashboard?.totalOrders ?? 4827}`, "+18.3% growth"],
          ["Mitra Aktif", `${dashboard?.activePartners ?? 312}`, "45 baru minggu ini"],
          ["Pelanggan Aktif", `${dashboard?.activeCustomers ?? 8241}`, "+31.2% MoM"]
        ].map(([label, value, trend]) => (
          <Card key={label} className="rounded-[16px] border-slate-100 shadow-[0_2px_12px_rgba(11,31,58,0.06)]">
            <CardContent className="p-3">
              <p className="text-[11px] font-semibold text-slate-500">{label}</p>
              <p className="text-balance-mobile mt-1 text-[17px] font-extrabold leading-tight min-[380px]:text-[19px]">{value}</p>
              <p className="mt-0.5 text-[10px] font-bold text-emerald-600">{trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <AdminEditCenter settings={settings} onSave={onSaveSettings} />
      <AdminControlCenter
        consoleData={consoleData}
        onSave={onSaveConsole}
        onUpdateCustomer={onUpdateCustomer}
        onDeleteCustomer={onDeleteCustomer}
        onUpdatePartner={onUpdatePartner}
        onDeletePartner={onDeletePartner}
      />
      <AdminWalletControl walletData={walletData} onAdjustWallet={onAdjustWallet} />
      <AdminFinancialAudit auditData={auditData} />

      <AdminMapsCenter mapData={mapData} />

      <div className="px-4 pb-4 sm:px-5">
        <h2 className="mb-2 text-sm font-extrabold">Pesanan Live</h2>
        <div className="overflow-hidden rounded-[16px] bg-white shadow-soft">
          <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr] gap-2 bg-cloud px-4 py-2.5 text-[10px] font-extrabold uppercase text-slate-500 min-[430px]:grid">
            <span>Pelanggan</span>
            <span>Layanan</span>
            <span>Total</span>
            <span>Status</span>
          </div>
          {loading ? (
            <div className="p-4">
              <div className="h-4 animate-pulse rounded bg-slate-100" />
            </div>
          ) : (
            liveOrders.map((order) => (
              <div key={order.id} className="border-t border-slate-100 px-3.5 py-3 text-[11px] min-[430px]:grid min-[430px]:grid-cols-[1.5fr_1fr_1fr_1fr] min-[430px]:items-center min-[430px]:gap-2 min-[430px]:py-2.5">
                <div className="min-w-0">
                  <span className="block truncate text-xs font-bold">{order.customerId}</span>
                  <span className="mt-0.5 block text-[10px] text-slate-500 min-[430px]:hidden">{order.serviceCategoryId}</span>
                </div>
                <span className="hidden truncate text-slate-500 min-[430px]:block">{order.serviceCategoryId}</span>
                <div className="mt-2 flex items-center justify-between gap-2 min-[430px]:mt-0 min-[430px]:contents">
                  <span className="font-bold">Rp {formatRupiah(order.total ?? 0)}</span>
                  <Badge variant="blue" className="justify-center px-2 text-[10px]">
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="px-4 pb-6 sm:px-5">
        <h2 className="mb-2 text-sm font-extrabold">Verifikasi Mitra Baru</h2>
        <div className="space-y-3">
          {pendingPartners.length ? (
            pendingPartners.map((partner) => (
              <Card key={partner.id} className="rounded-[16px] border-slate-100">
                <CardContent className="p-3.5">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
                      <Sparkles className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[13px] font-extrabold">{partner.name}</h3>
                      <p className="truncate text-[11px] text-slate-500">{partner.category} - {partner.documents?.length ?? 0} syarat dikirim</p>
                    </div>
                    <Badge variant="warning" className="rounded-md text-[10px]">Menunggu</Badge>
                  </div>
                  <div className="mb-3 grid gap-2">
                    {(partner.documents ?? []).map((document: any) => (
                      <div key={document.id} className="rounded-[12px] bg-cloud px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] font-extrabold text-slate-700">{document.label}</p>
                          <Badge variant="blue" className="rounded-md text-[9px]">{document.status}</Badge>
                        </div>
                        {typeof document.value === "string" && (document.value.startsWith("data:image/") || document.value.startsWith("https://")) ? (
                          <img src={document.value} alt={document.label} className="mt-2 h-28 w-full rounded-[12px] object-cover" />
                        ) : (
                          <p className="mt-1 break-words text-[10px] leading-4 text-slate-500">{document.value}</p>
                        )}
                      </div>
                    ))}
                    {!(partner.documents ?? []).length && (
                      <p className="rounded-[12px] bg-red-50 px-3 py-2 text-[11px] font-bold text-red-700">
                        Dokumen belum masuk lengkap.
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-3">
                    <Button variant="outline" className="border-2 border-red-600 text-red-600 min-[360px]:col-span-1" onClick={() => void onReviewPartner(partner.id, "reject")}>
                      Tolak
                    </Button>
                    <Button variant="navy" className="min-[360px]:col-span-2" onClick={() => void onReviewPartner(partner.id, "approve")}>
                      Verifikasi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="rounded-[16px] bg-white p-4 text-sm text-slate-500 shadow-soft">Tidak ada mitra pending.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function AdminEditCenter({
  settings,
  onSave
}: {
  settings: AdminSettings;
  onSave: (settings: AdminSettings) => Promise<void>;
}) {
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty && !saving) setDraft({ ...initialAdminSettings, ...settings });
  }, [settings, dirty, saving]);

  const update = (patch: Partial<AdminSettings>) => {
    setDirty(true);
    setDraft((current) => ({ ...current, ...patch }));
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 pb-4 sm:px-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-sm font-extrabold">Pusat Edit Admin</h2>
        {dirty && <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-extrabold text-amber-700">Belum disimpan</span>}
      </div>
      <div className="rounded-[16px] bg-white p-4 shadow-soft">
        <div className="grid gap-3">
          <div>
            <Label>Biaya Platform</Label>
            <Input
              value={String(draft.platformFee)}
              inputMode="numeric"
              onChange={(event) => update({ platformFee: Number(event.target.value || 0) })}
            />
          </div>
          <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
            <div>
              <Label>Kode Promo</Label>
              <Input value={draft.promoCode} onChange={(event) => update({ promoCode: event.target.value.toUpperCase() })} />
            </div>
            <div>
              <Label>Diskon Promo</Label>
              <Input
                value={String(draft.promoDiscount)}
                inputMode="numeric"
                onChange={(event) => update({ promoDiscount: Number(event.target.value || 0) })}
              />
            </div>
          </div>
          <div>
            <Label>Area Layanan</Label>
            <Input value={draft.serviceArea} onChange={(event) => update({ serviceArea: event.target.value })} />
          </div>
          <div>
            <Label>Nomor Support</Label>
            <Input value={draft.supportPhone} onChange={(event) => update({ supportPhone: event.target.value })} />
          </div>
          <div className="rounded-[14px] bg-cloud p-3">
            <p className="mb-2 text-xs font-extrabold uppercase text-slate-500">Tujuan Top Up Manual SERJAFAN</p>
            <div className="grid gap-2">
              <div>
                <Label>Nama Bank</Label>
                <Input value={draft.manualBankName} onChange={(event) => update({ manualBankName: event.target.value })} />
              </div>
              <div>
                <Label>Nomor Rekening</Label>
                <Input value={draft.manualBankAccount} onChange={(event) => update({ manualBankAccount: event.target.value })} />
              </div>
              <div>
                <Label>Nama Pemilik Rekening</Label>
                <Input value={draft.manualBankHolder} onChange={(event) => update({ manualBankHolder: event.target.value })} />
              </div>
              <div>
                <Label>Nomor DANA SERJAFAN</Label>
                <Input value={draft.manualDanaNumber} onChange={(event) => update({ manualDanaNumber: event.target.value })} />
              </div>
              <div>
                <Label>Nama Akun DANA</Label>
                <Input value={draft.manualDanaName} onChange={(event) => update({ manualDanaName: event.target.value })} />
              </div>
              <div>
                <Label>Nama QRIS SERJAFAN</Label>
                <Input value={draft.manualQrisName} onChange={(event) => update({ manualQrisName: event.target.value })} />
              </div>
            </div>
          </div>
          <Button variant="orange" disabled={saving} onClick={() => void saveDraft()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {saving ? "Menyimpan..." : "Simpan Perubahan Sistem"}
          </Button>
        </div>
      </div>
      <div className="sticky bottom-3 z-20 mt-3 rounded-[18px] bg-white/95 p-2 shadow-[0_12px_30px_rgba(11,31,58,0.18)] backdrop-blur">
        <Button variant="orange" className="w-full" disabled={saving || !dirty} onClick={() => void saveDraft()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {saving ? "Menyimpan..." : dirty ? "Simpan Data Admin" : "Data Sudah Tersimpan"}
        </Button>
      </div>
    </div>
  );
}

function AdminWalletControl({
  walletData,
  onAdjustWallet
}: {
  walletData: AdminWalletData;
  onAdjustWallet: (payload: { userId?: string; amount?: number; description: string; action?: "ADJUST" | "APPROVE_TOPUP" | "REJECT_TOPUP"; paymentIntentId?: string }) => void;
}) {
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("25000");
  const [description, setDescription] = useState("Top up saldo manual oleh admin");

  const selectedWallet = walletData.wallets.find((wallet) => wallet.userId === userId);

  return (
    <div className="px-4 pb-4 sm:px-5">
      <h2 className="mb-2 text-sm font-extrabold">Kendali Dompet Admin</h2>
      <div className="grid gap-3">
        <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
          {[
            ["Total Saldo Sistem", `Rp ${formatRupiah(walletData.summary.totalBalance)}`],
            ["Total Wallet", `${walletData.summary.totalWallets}`],
            ["Wallet Customer", `${walletData.summary.customerWallets}`],
            ["Wallet Partner", `${walletData.summary.partnerWallets}`]
          ].map(([label, value]) => (
            <div key={label} className="rounded-[16px] bg-white p-4 shadow-soft">
              <p className="text-[11px] font-bold text-slate-500">{label}</p>
              <p className="mt-1 text-sm font-extrabold text-navy">{value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[16px] bg-white p-4 shadow-soft">
          <p className="mb-2 text-xs font-extrabold uppercase text-slate-500">Top Up Manual Menunggu Admin</p>
          <div className="space-y-2">
            {(walletData.pendingTopups ?? []).map((item) => (
              <div key={item.id} className="rounded-[14px] border border-amber-100 bg-amber-50 p-3">
                {(() => {
                  const manual = readManualTopUpPayload(item.rawPayload);
                  return (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-extrabold text-navy">{item.name ?? item.email ?? item.userId}</p>
                          <p className="mt-1 text-[11px] text-amber-800">
                            {item.role ?? "USER"} - {item.channel} - Rp {formatRupiah(item.amount)}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-500">ID: {item.id}</p>
                        </div>
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-extrabold text-amber-700">{item.status}</span>
                      </div>
                      {(manual.senderName || manual.reference) && (
                        <div className="mt-3 rounded-[12px] bg-white/70 p-3 text-[11px] font-bold text-slate-600">
                          {manual.senderName && <p>Pengirim: <span className="text-navy">{manual.senderName}</span></p>}
                          {manual.reference && <p className="mt-1">Referensi: <span className="text-navy">{manual.reference}</span></p>}
                        </div>
                      )}
                      {manual.proofImage ? (
                        <div className="mt-3 rounded-[12px] bg-white/80 p-2">
                          <p className="mb-2 text-[10px] font-extrabold uppercase text-slate-500">Bukti Transfer</p>
                          <img src={manual.proofImage} alt="Bukti transfer top up" className="max-h-56 w-full rounded-[10px] object-contain" />
                        </div>
                      ) : (
                        <div className="mt-3 rounded-[12px] bg-red-50 p-2 text-[10px] font-extrabold text-red-700">
                          Bukti transfer belum diupload. Jangan setujui sebelum bukti lengkap.
                        </div>
                      )}
                      <div className="mt-3 rounded-[12px] border border-amber-200 bg-white/60 p-2 text-[10px] font-bold leading-4 text-amber-800">
                        Setujui hanya setelah uang benar-benar terlihat masuk di mutasi Bank Nagari/DANA admin dan bukti transfer cocok.
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                        <Button
                          variant="orange"
                          onClick={() =>
                            onAdjustWallet({
                              action: "APPROVE_TOPUP",
                              paymentIntentId: item.id,
                              description: `Top up manual ${item.channel} disetujui admin setelah cek mutasi`
                            })
                          }
                        >
                          <Check className="h-4 w-4" /> Setujui
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() =>
                            onAdjustWallet({
                              action: "REJECT_TOPUP",
                              paymentIntentId: item.id,
                              description: "Top up manual ditolak admin. Uang belum terlihat masuk, bukti transfer belum lengkap, atau data transfer belum cocok."
                            })
                          }
                        >
                          Tolak
                        </Button>
                      </div>
                    </>
                  );
                })()}
              </div>
            ))}
            {!(walletData.pendingTopups ?? []).length && <p className="text-xs text-slate-500">Tidak ada top up manual yang menunggu verifikasi.</p>}
          </div>
        </div>

        <div className="rounded-[16px] bg-white p-4 shadow-soft">
          <Label>Pilih Akun</Label>
          <select
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            className="mb-3 h-11 w-full rounded-[12px] border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-flame"
          >
            <option value="">Pilih customer / partner / admin</option>
            {walletData.wallets.map((wallet) => (
              <option key={wallet.walletId} value={wallet.userId}>
                {wallet.name ?? wallet.userId} - {wallet.role ?? "USER"} - Rp {formatRupiah(wallet.balance)}
              </option>
            ))}
          </select>
          {selectedWallet && (
            <div className="mb-3 rounded-[14px] bg-cloud p-3 text-xs">
              <p className="font-extrabold">{selectedWallet.name ?? selectedWallet.userId}</p>
              <p className="mt-1 text-slate-500">{selectedWallet.email} - {selectedWallet.role}</p>
              <p className="mt-1 font-extrabold text-navy">Saldo sekarang Rp {formatRupiah(selectedWallet.balance)}</p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-2">
            <Input value={amount} inputMode="numeric" onChange={(event) => setAmount(event.target.value.replace(/[^\d-]/g, ""))} placeholder="Nominal, minus untuk potong" />
            <Button
              variant="orange"
              className="w-full"
              disabled={!userId || !Number(amount)}
              onClick={() => onAdjustWallet({ action: "ADJUST", userId, amount: Number(amount), description })}
            >
              Simpan Saldo
            </Button>
          </div>
          <Input className="mt-2" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Keterangan transaksi admin" />
          <p className="mt-2 text-[11px] leading-5 text-slate-500">
            Admin bisa menambah saldo dengan nominal positif atau mengurangi saldo dengan nominal minus, semua tercatat di riwayat transaksi akun.
          </p>
        </div>

        <div className="rounded-[16px] bg-white p-4 shadow-soft">
          <p className="mb-2 text-xs font-extrabold uppercase text-slate-500">Transaksi Terbaru Sistem</p>
          <div className="space-y-2">
            {walletData.transactions.slice(0, 8).map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-[12px] bg-cloud px-3 py-2.5">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-xs font-extrabold">{item.description}</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase text-slate-500">{item.type}</p>
                </div>
                <span className={cn("shrink-0 text-xs font-extrabold", item.amount < 0 ? "text-red-600" : "text-emerald-600")}>
                  {item.amount < 0 ? "-" : "+"}Rp {formatRupiah(Math.abs(item.amount))}
                </span>
              </div>
            ))}
            {!walletData.transactions.length && <p className="text-xs text-slate-500">Belum ada transaksi wallet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminFinancialAudit({ auditData }: { auditData: AdminAuditData }) {
  const summary = auditData.summary;
  const rows = [
    ["Order selesai", `${summary.completedOrders}`, `Rp ${formatRupiah(summary.grossOrderValue)}`],
    ["Top up terverifikasi", `${summary.paidTopupCount}`, `Rp ${formatRupiah(summary.paidTopupAmount)}`],
    ["Top up pending", `${summary.pendingTopupCount}`, `Rp ${formatRupiah(summary.pendingTopupAmount)}`],
    ["Komisi platform", `${summary.platformCommissionCount}`, `Rp ${formatRupiah(summary.platformCommissionAmount)}`],
    ["Liability saldo", "Sistem", `Rp ${formatRupiah(summary.walletLiability)}`],
    ["Deposit partner", "Aktif", `Rp ${formatRupiah(summary.partnerDepositBalance)}`]
  ];

  return (
    <div className="px-4 pb-4 sm:px-5">
      <div className="rounded-[18px] bg-white p-4 shadow-soft">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase text-slate-500">Audit Keuangan</p>
            <h2 className="text-base font-extrabold">Ringkasan siap diperiksa</h2>
          </div>
          <Badge variant="blue" className="rounded-md">Ledger</Badge>
        </div>
        <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
          {rows.map(([label, count, amount]) => (
            <div key={label} className="rounded-[14px] bg-cloud p-3">
              <p className="text-[10px] font-extrabold uppercase text-slate-500">{label}</p>
              <div className="mt-1 flex items-end justify-between gap-2">
                <span className="text-sm font-extrabold">{count}</span>
                <span className="text-xs font-bold text-navy">{amount}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-[14px] border border-slate-100">
          {(auditData.recentAuditLogs ?? []).slice(0, 6).map((log) => (
            <div key={log.id} className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 last:border-b-0">
              <div className="min-w-0">
                <p className="truncate text-xs font-extrabold">{log.action.replaceAll("_", " ")}</p>
                <p className="truncate text-[10px] text-slate-500">{log.actorRole ?? "SYSTEM"} - {log.entityType}{log.entityId ? `/${log.entityId}` : ""}</p>
              </div>
              <Badge variant={log.severity === "WARN" || log.severity === "ERROR" || log.severity === "CRITICAL" ? "warning" : "blue"} className="rounded-md text-[9px]">
                {log.severity}
              </Badge>
            </div>
          ))}
          {!auditData.recentAuditLogs.length && <p className="p-3 text-xs text-slate-500">Audit log akan terisi setelah ada top up, order, chat, atau perubahan admin.</p>}
        </div>
      </div>
    </div>
  );
}

function AdminMapsCenter({ mapData }: { mapData: AdminMapData }) {
  const primaryPair = mapData.pairs[0];

  if (!primaryPair) {
    return (
      <div className="px-4 pb-4 sm:px-5">
        <h2 className="mb-2 text-sm font-extrabold">Maps Pantau Customer & Teknisi</h2>
        <div className="rounded-[16px] bg-white p-4 text-sm text-slate-500 shadow-soft">
          Belum ada customer dan teknisi yang sedang terhubung order aktif.
        </div>
      </div>
    );
  }

  const primaryRoute: ConnectedRoute = {
    origin: {
      label: primaryPair.partner.label,
      address: primaryPair.partner.address,
      lat: primaryPair.partner.latitude,
      lng: primaryPair.partner.longitude,
      role: "partner"
    },
    destination: {
      label: primaryPair.customer.label,
      address: primaryPair.customer.address,
      lat: primaryPair.customer.latitude,
      lng: primaryPair.customer.longitude,
      role: "customer"
    },
    status: primaryPair.status,
    eta: primaryPair.partner.status
  };

  return (
    <div className="px-4 pb-4 sm:px-5">
      <h2 className="mb-2 text-sm font-extrabold">Maps Pantau Customer & Teknisi</h2>
      <div className="grid gap-3">
        <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-3">
          {[
            ["Order Dipantau", mapData.summary.monitoredOrders],
            ["Customer", mapData.summary.monitoredCustomers],
            ["Teknisi", mapData.summary.monitoredPartners]
          ].map(([label, value]) => (
            <div key={label} className="rounded-[14px] bg-white p-3 text-center shadow-soft">
              <p className="text-[10px] font-bold text-slate-500">{label}</p>
              <p className="mt-1 text-lg font-extrabold text-navy">{value}</p>
            </div>
          ))}
        </div>

        <ConnectedGoogleMap title="Google Maps Pantauan Admin" route={primaryRoute} height={230} />

        <div className="rounded-[16px] bg-white p-3 shadow-soft">
          <p className="mb-2 text-[11px] font-bold uppercase text-slate-500">Posisi customer dan teknisi</p>
          <div className="space-y-2">
            {mapData.pairs.slice(0, 6).map((pair) => {
              const route: ConnectedRoute = {
                origin: {
                  label: pair.partner.label,
                  address: pair.partner.address,
                  lat: pair.partner.latitude,
                  lng: pair.partner.longitude,
                  role: "partner"
                },
                destination: {
                  label: pair.customer.label,
                  address: pair.customer.address,
                  lat: pair.customer.latitude,
                  lng: pair.customer.longitude,
                  role: "customer"
                },
                status: pair.status,
                eta: pair.partner.status
              };

              return (
                <div key={pair.orderId} className="rounded-[14px] border border-slate-100 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-extrabold">{pair.orderId} - {pair.serviceCategoryId}</p>
                      <p className="text-[11px] text-slate-500">Status order: {pair.status}</p>
                    </div>
                    <Badge variant={pair.partner.status === "ONLINE" ? "success" : "warning"}>{pair.partner.status}</Badge>
                  </div>
                  <div className="grid gap-2 text-[11px]">
                    <div className="flex items-start gap-2 rounded-[12px] bg-blue-50 p-2">
                      <Bike className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                      <span className="min-w-0">
                        <span className="block font-extrabold text-blue-800">Teknisi: {pair.partner.label}</span>
                        <span className="block truncate text-blue-700">{pair.partner.address}</span>
                        <span className="block text-blue-600">{pair.partner.latitude.toFixed(4)}, {pair.partner.longitude.toFixed(4)}</span>
                      </span>
                    </div>
                    <div className="flex items-start gap-2 rounded-[12px] bg-orange-50 p-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-flame" />
                      <span className="min-w-0">
                        <span className="block font-extrabold text-orange-800">Customer: {pair.customer.label}</span>
                        <span className="block truncate text-orange-700">{pair.customer.address}</span>
                        <span className="block text-orange-600">{pair.customer.latitude.toFixed(4)}, {pair.customer.longitude.toFixed(4)}</span>
                      </span>
                    </div>
                  </div>
                  <a
                    href={googleMapsDirectionsUrl(route)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-navy px-3 py-2 text-xs font-extrabold text-white"
                  >
                    <Navigation className="h-4 w-4" /> Buka Pantauan di Google Maps
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminControlCenter({
  consoleData,
  onSave,
  onUpdateCustomer,
  onDeleteCustomer,
  onUpdatePartner,
  onDeletePartner
}: {
  consoleData: AdminConsoleData;
  onSave: (settings: AdminConsoleData["settings"]) => Promise<void>;
  onUpdateCustomer: (customerId: string, payload: any) => Promise<void>;
  onDeleteCustomer: (customerId: string) => Promise<void>;
  onUpdatePartner: (partnerId: string, payload: any) => Promise<void>;
  onDeletePartner: (partnerId: string) => Promise<void>;
}) {
  const [tab, setTab] = useState<"customer" | "partner" | "services" | "promo" | "registration">("services");
  const [draft, setDraft] = useState<AdminConsoleData["settings"]>(consoleData.settings);
  const [newService, setNewService] = useState({ name: "", fee: "25000", description: "" });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty && !saving) setDraft(consoleData.settings);
  }, [consoleData.settings, dirty, saving]);

  const mutateDraft = (updater: (current: AdminConsoleData["settings"]) => AdminConsoleData["settings"]) => {
    setDirty(true);
    setDraft(updater);
  };

  const updateService = (index: number, patch: Partial<AdminConsoleData["settings"]["services"][number]>) => {
    mutateDraft((current) => ({
      ...current,
      services: current.services.map((service, serviceIndex) => (serviceIndex === index ? { ...service, ...patch } : service))
    }));
  };

  const updatePromo = (index: number, patch: Partial<AdminConsoleData["settings"]["promos"][number]>) => {
    mutateDraft((current) => ({
      ...current,
      promos: current.promos.map((promo, promoIndex) => (promoIndex === index ? { ...promo, ...patch, code: (patch.code ?? promo.code).toUpperCase() } : promo))
    }));
  };

  const updateRequirement = (index: number, patch: Partial<AdminConsoleData["settings"]["partnerRequirements"][number]>) => {
    mutateDraft((current) => ({
      ...current,
      partnerRequirements: current.partnerRequirements.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    }));
  };

  const saveDraft = async (nextDraft = draft) => {
    setSaving(true);
    try {
      await onSave(nextDraft);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const addService = () => {
    const name = newService.name.trim();
    const description = newService.description.trim();
    if (!name) return;

    const service = {
      id: `svc_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "baru"}_${Date.now()}`,
      name,
      fee: Number(newService.fee || 0),
      active: true,
      description: description || `Jasa ${name} dari admin.`
    };

    setDirty(true);
    setDraft((current) => {
      const next = {
        ...current,
        services: [...current.services, service]
      };
      void saveDraft(next);
      return next;
    });
    setNewService({ name: "", fee: "25000", description: "" });
  };

  const addBlankService = () => {
    mutateDraft((current) => ({
      ...current,
      services: [
        ...current.services,
        { id: `svc_${Date.now()}`, name: "Jasa Baru", fee: 25000, active: true, description: "Deskripsi jasa baru dari admin." }
      ]
    }));
  };

  const addPromo = () => {
    mutateDraft((current) => ({
      ...current,
      promos: [
        ...current.promos,
        {
          code: "PROMO",
          discount: 10000,
          active: true,
          title: "Promo Baru SERJAFAN",
          description: "Deskripsi promo yang akan tampil di aplikasi customer.",
          note: "Promo baru dari admin.",
          mediaUrl: "",
          mediaType: null
        }
      ]
    }));
  };

  return (
    <div className="px-4 pb-4 sm:px-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-sm font-extrabold">Pusat Kontrol Admin</h2>
        {dirty && <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-extrabold text-amber-700">Belum disimpan</span>}
      </div>
      <div className="overflow-hidden rounded-[18px] bg-white p-3 shadow-soft">
        <div className="flex gap-1 overflow-x-auto rounded-[14px] bg-cloud p-1 no-scrollbar">
          {[
            ["customer", "Edit Customer"],
            ["partner", "Edit Partner"],
            ["services", "Jasa"],
            ["promo", "Promo"],
            ["registration", "Daftar"]
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value as typeof tab)}
              className={cn("min-w-[76px] rounded-[10px] px-2 py-2 text-[10px] font-extrabold", tab === value ? "bg-white text-flame shadow-[0_2px_10px_rgba(11,31,58,0.08)]" : "text-slate-500")}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "customer" && (
          <div className="mt-3 grid gap-3">
            <AdminTextEditor
              title="Tampilan Customer"
              headline={draft.customerFeatureCopy.headline}
              description={draft.customerFeatureCopy.description}
              onChange={(patch) => mutateDraft((current) => ({ ...current, customerFeatureCopy: { ...current.customerFeatureCopy, ...patch } }))}
            />
            <div className="rounded-[16px] bg-[#eef4ff] p-3 text-xs font-semibold leading-5 text-[#0d47d9]">
              Yang diedit di sini tersambung ke aplikasi customer: judul/teks beranda, data customer, alamat, dan tampilan layanan dari menu Jasa.
            </div>
            <div className="rounded-[16px] bg-white p-4 shadow-soft">
              <p className="mb-3 text-xs font-extrabold uppercase text-slate-500">Edit / Hapus Customer</p>
              <div className="grid gap-3">
                {consoleData.customers.map((customer) => (
                  <AdminCustomerEditor
                    key={customer.id}
                    customer={customer}
                    onSave={(payload) => onUpdateCustomer(customer.id, payload)}
                    onDelete={() => onDeleteCustomer(customer.id)}
                  />
                ))}
                {!consoleData.customers.length && <p className="text-xs text-slate-500">Belum ada customer.</p>}
              </div>
            </div>
          </div>
        )}

        {tab === "partner" && (
          <div className="mt-3 grid gap-3">
            <AdminTextEditor
              title="Tampilan Fitur Partner"
              headline={draft.partnerFeatureCopy.headline}
              description={draft.partnerFeatureCopy.description}
              onChange={(patch) => mutateDraft((current) => ({ ...current, partnerFeatureCopy: { ...current.partnerFeatureCopy, ...patch } }))}
            />
            <div className="rounded-[16px] bg-[#eef4ff] p-3 text-xs font-semibold leading-5 text-[#0d47d9]">
              Yang diedit di sini tersambung ke aplikasi partner: teks dashboard partner, data pembayaran mitra, status, rekening, DANA, dan profil layanan.
            </div>
            <div className="rounded-[16px] bg-white p-4 shadow-soft">
              <p className="mb-3 text-xs font-extrabold uppercase text-slate-500">Partner Terdaftar & Data Pembayaran</p>
              <div className="grid gap-2">
                {consoleData.partners.map((partner) => (
                  <AdminPartnerEditor
                    key={partner.id}
                    partner={partner}
                    onSave={(payload) => onUpdatePartner(partner.id, payload)}
                    onDelete={() => onDeletePartner(partner.id)}
                  />
                ))}
                {!consoleData.partners.length && <p className="text-xs text-slate-500">Belum ada partner.</p>}
              </div>
            </div>
          </div>
        )}

        {tab === "services" && (
          <div className="mt-3 grid gap-3">
            <div className="rounded-[16px] bg-navy p-4 text-white">
              <p className="text-[11px] font-bold text-white/65">TAMBAH JASA BARU</p>
              <h3 className="mt-1 text-sm font-extrabold">Isi data jasa, lalu langsung simpan</h3>
              <div className="mt-3 grid gap-2">
                <Input
                  value={newService.name}
                  onChange={(event) => setNewService((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Nama jasa, contoh: Laundry Kiloan"
                  className="border-white/10 bg-white text-slate-950"
                />
                <Input
                  value={newService.fee}
                  inputMode="numeric"
                  onChange={(event) => setNewService((current) => ({ ...current, fee: event.target.value }))}
                  placeholder="Harga mulai"
                  className="border-white/10 bg-white text-slate-950"
                />
                <textarea
                  value={newService.description}
                  onChange={(event) => setNewService((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Deskripsi singkat jasa"
                  className="min-h-20 w-full rounded-[12px] border border-white/10 bg-white p-3 text-xs text-slate-950 outline-none focus:ring-2 focus:ring-flame"
                />
                <Button variant="orange" disabled={!newService.name.trim()} onClick={addService}>
                  <Sparkles className="h-4 w-4" /> Tambah & Simpan Jasa
                </Button>
              </div>
            </div>

            {draft.services.map((service, index) => (
              <div key={service.id} className="rounded-[14px] border border-slate-100 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-extrabold">Menu Jasa</p>
                  <Switch checked={service.active} onCheckedChange={(active) => updateService(index, { active })} />
                </div>
                <Input className="mb-2" value={service.name} onChange={(event) => updateService(index, { name: event.target.value })} />
                <Input className="mb-2" value={String(service.fee)} inputMode="numeric" onChange={(event) => updateService(index, { fee: Number(event.target.value || 0) })} />
                <textarea
                  value={service.description}
                  onChange={(event) => updateService(index, { description: event.target.value })}
                  className="min-h-20 w-full rounded-[12px] border border-slate-200 p-3 text-xs outline-none focus:ring-2 focus:ring-flame"
                />
              </div>
            ))}
            <Button variant="outline" className="border-2 border-navy text-navy" onClick={addBlankService}>
              <Sparkles className="h-4 w-4" /> Tambah Baris Manual
            </Button>
          </div>
        )}

        {tab === "promo" && (
          <div className="mt-3 grid gap-3">
            {draft.promos.map((promo, index) => (
              <div key={`${promo.code}-${index}`} className="rounded-[18px] border border-slate-100 bg-white p-3 shadow-[0_2px_12px_rgba(11,31,58,0.04)]">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-extrabold">Promo Customer</p>
                    <p className="text-[10px] font-bold text-slate-500">Tampil di bagian Promo Hari Ini</p>
                  </div>
                  <Switch checked={promo.active} onCheckedChange={(active) => updatePromo(index, { active })} />
                </div>
                <PromoMediaField
                  value={promo.mediaUrl}
                  type={promo.mediaType}
                  onChange={(mediaUrl, mediaType) => updatePromo(index, { mediaUrl, mediaType })}
                />
                <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
                  <div>
                    <Label>Kode Promo</Label>
                    <Input value={promo.code} onChange={(event) => updatePromo(index, { code: event.target.value })} />
                  </div>
                  <div>
                    <Label>Diskon</Label>
                    <Input value={String(promo.discount)} inputMode="numeric" onChange={(event) => updatePromo(index, { discount: Number(event.target.value || 0) })} />
                  </div>
                </div>
                <div className="mt-2">
                  <Label>Judul Promo</Label>
                  <Input value={promo.title ?? promo.note ?? ""} onChange={(event) => updatePromo(index, { title: event.target.value })} />
                </div>
                <div className="mt-2">
                  <Label>Deskripsi Promo</Label>
                  <textarea
                    value={promo.description ?? promo.note ?? ""}
                    onChange={(event) => updatePromo(index, { description: event.target.value, note: event.target.value })}
                    className="min-h-20 w-full rounded-[12px] border border-slate-200 p-3 text-xs outline-none focus:ring-2 focus:ring-flame"
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" className="border-2 border-navy text-navy" onClick={addPromo}>
              <Tag className="h-4 w-4" /> Tambah Promo
            </Button>
          </div>
        )}

        {tab === "registration" && (
          <div className="mt-3 grid gap-3">
            <div className="rounded-[14px] bg-orange-50 p-3">
              <p className="text-xs font-extrabold text-orange-800">Pendaftaran Partner</p>
              <p className="mt-1 text-[11px] leading-5 text-orange-700">Dokumen berikut menjadi syarat akun partner baru sebelum admin verifikasi.</p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-[14px] border border-slate-100 bg-white p-3">
              <div>
                <p className="text-xs font-extrabold text-navy">Batasi pendaftaran partner</p>
                <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500">
                  Jika aktif, orang yang daftar partner akan ditolak dengan notifikasi kuota mitra sudah cukup.
                </p>
              </div>
              <Switch
                checked={draft.partnerRegistrationLimited}
                onCheckedChange={(partnerRegistrationLimited) => mutateDraft((current) => ({ ...current, partnerRegistrationLimited }))}
              />
            </div>
            {draft.partnerRequirements.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 rounded-[14px] border border-slate-100 p-3">
                <Input value={item.label} onChange={(event) => updateRequirement(index, { label: event.target.value })} />
                <Switch checked={item.required} onCheckedChange={(required) => updateRequirement(index, { required })} />
              </div>
            ))}
          </div>
        )}

        <Button variant="orange" className="mt-4 w-full" disabled={saving} onClick={() => void saveDraft()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {saving ? "Menyimpan..." : "Simpan Pusat Kontrol Admin"}
        </Button>
        <div className="sticky bottom-3 z-20 mt-3 rounded-[18px] bg-white/95 p-2 shadow-[0_12px_30px_rgba(11,31,58,0.18)] backdrop-blur">
          <Button variant="orange" className="w-full" disabled={saving || !dirty} onClick={() => void saveDraft()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {saving ? "Menyimpan..." : dirty ? "Simpan Pusat Kontrol" : "Data Sudah Tersimpan"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdminCustomerEditor({
  customer,
  onSave,
  onDelete
}: {
  customer: any;
  onSave: (payload: any) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [draft, setDraft] = useState({
    name: customer.name ?? "",
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    location: customer.location ?? "",
    image: customer.image ?? null
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft({
      name: customer.name ?? "",
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      location: customer.location ?? "",
      image: customer.image ?? null
    });
  }, [customer]);

  return (
    <div className="rounded-[14px] border border-slate-100 bg-cloud p-3">
      <div className="grid gap-2">
        <Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Nama customer" />
        <Input value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} placeholder="Email customer" type="email" />
        <Input value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} placeholder="Nomor HP" inputMode="tel" />
        <textarea
          value={draft.location}
          onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))}
          placeholder="Alamat customer"
          className="min-h-16 w-full rounded-[12px] border border-slate-200 bg-white p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-flame"
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="outline" className="border-2 border-red-600 text-red-600" onClick={() => void onDelete()}>
          <Trash2 className="h-4 w-4" /> Hapus
        </Button>
        <Button
          variant="orange"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await onSave(draft);
            setSaving(false);
          }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Simpan
        </Button>
      </div>
    </div>
  );
}

function AdminPartnerEditor({
  partner,
  onSave,
  onDelete
}: {
  partner: any;
  onSave: (payload: any) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [draft, setDraft] = useState({
    name: partner.name ?? "",
    category: partner.category ?? "",
    contactPhone: partner.contactPhone ?? "",
    priceFrom: String(partner.priceFrom ?? 0),
    status: partner.status ?? "OFFLINE",
    verificationStatus: partner.verificationStatus ?? "PENDING",
    paymentBankName: partner.paymentBankName ?? "",
    paymentBankAccount: partner.paymentBankAccount ?? "",
    paymentBankHolder: partner.paymentBankHolder ?? "",
    paymentDanaNumber: partner.paymentDanaNumber ?? "",
    paymentDanaName: partner.paymentDanaName ?? "",
    acceptsCash: partner.acceptsCash !== false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft({
      name: partner.name ?? "",
      category: partner.category ?? "",
      contactPhone: partner.contactPhone ?? "",
      priceFrom: String(partner.priceFrom ?? 0),
      status: partner.status ?? "OFFLINE",
      verificationStatus: partner.verificationStatus ?? "PENDING",
      paymentBankName: partner.paymentBankName ?? "",
      paymentBankAccount: partner.paymentBankAccount ?? "",
      paymentBankHolder: partner.paymentBankHolder ?? "",
      paymentDanaNumber: partner.paymentDanaNumber ?? "",
      paymentDanaName: partner.paymentDanaName ?? "",
      acceptsCash: partner.acceptsCash !== false
    });
  }, [partner]);

  return (
    <div className="rounded-[14px] border border-slate-100 bg-cloud p-3">
      <div className="grid gap-2">
        <div className="grid gap-2 min-[420px]:grid-cols-2">
          <Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Nama usaha/jasa" />
          <Input value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} placeholder="Kategori jasa" />
        </div>
        <div className="grid gap-2 min-[420px]:grid-cols-2">
          <Input value={draft.contactPhone} onChange={(event) => setDraft((current) => ({ ...current, contactPhone: event.target.value }))} placeholder="Nomor HP partner" />
          <Input value={draft.priceFrom} onChange={(event) => setDraft((current) => ({ ...current, priceFrom: event.target.value }))} placeholder="Harga mulai" inputMode="numeric" />
        </div>
        <div className="grid gap-2 min-[420px]:grid-cols-2">
          <select className="h-10 rounded-[12px] border border-slate-200 bg-white px-3 text-xs font-bold" value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>
            <option value="ONLINE">ONLINE</option>
            <option value="BUSY">BUSY</option>
            <option value="OFFLINE">OFFLINE</option>
          </select>
          <select className="h-10 rounded-[12px] border border-slate-200 bg-white px-3 text-xs font-bold" value={draft.verificationStatus} onChange={(event) => setDraft((current) => ({ ...current, verificationStatus: event.target.value }))}>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
        <Input value={draft.paymentBankName} onChange={(event) => setDraft((current) => ({ ...current, paymentBankName: event.target.value }))} placeholder="Nama bank partner" />
        <Input value={draft.paymentBankAccount} onChange={(event) => setDraft((current) => ({ ...current, paymentBankAccount: event.target.value }))} placeholder="Nomor rekening partner" />
        <Input value={draft.paymentBankHolder} onChange={(event) => setDraft((current) => ({ ...current, paymentBankHolder: event.target.value }))} placeholder="Nama pemilik rekening" />
        <Input value={draft.paymentDanaNumber} onChange={(event) => setDraft((current) => ({ ...current, paymentDanaNumber: event.target.value }))} placeholder="Nomor DANA partner" />
        <Input value={draft.paymentDanaName} onChange={(event) => setDraft((current) => ({ ...current, paymentDanaName: event.target.value }))} placeholder="Nama akun DANA partner" />
        <div className="flex items-center justify-between rounded-[12px] bg-white p-3">
          <span className="text-xs font-extrabold text-slate-600">Terima pembayaran tunai</span>
          <Switch checked={draft.acceptsCash} onCheckedChange={(acceptsCash) => setDraft((current) => ({ ...current, acceptsCash }))} />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="outline" className="border-2 border-red-600 text-red-600" onClick={() => void onDelete()}>
          <Trash2 className="h-4 w-4" /> Hapus
        </Button>
        <Button
          variant="orange"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await onSave({ ...draft, priceFrom: Number(draft.priceFrom || 0) });
            setSaving(false);
          }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Simpan
        </Button>
      </div>
    </div>
  );
}

function AdminTextEditor({
  title,
  headline,
  description,
  onChange
}: {
  title: string;
  headline: string;
  description: string;
  onChange: (patch: { headline?: string; description?: string }) => void;
}) {
  return (
    <div className="rounded-[14px] border border-slate-100 p-3">
      <p className="mb-2 text-xs font-extrabold">{title}</p>
      <Input className="mb-2" value={headline} onChange={(event) => onChange({ headline: event.target.value })} />
      <textarea
        value={description}
        onChange={(event) => onChange({ description: event.target.value })}
        className="min-h-20 w-full rounded-[12px] border border-slate-200 p-3 text-xs outline-none focus:ring-2 focus:ring-flame"
      />
    </div>
  );
}

function PromoMediaField({
  value,
  type,
  onChange
}: {
  value?: string;
  type?: "image" | "video" | null;
  onChange: (value: string, type: "image" | "video" | null) => void;
}) {
  const inputId = useMemo(() => `promo-media-${Math.random().toString(36).slice(2)}`, []);
  const [error, setError] = useState("");

  const pick = async (file?: File) => {
    setError("");
    if (!file) return;
    const mediaType = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : null;
    if (!mediaType) {
      setError("File harus foto atau video.");
      return;
    }
    const maxSize = mediaType === "video" ? 2_200_000 : 900_000;
    if (file.size > maxSize) {
      setError(mediaType === "video" ? "Video terlalu besar. Pakai video pendek maksimal sekitar 2 MB." : "Foto terlalu besar. Pilih foto maksimal sekitar 900 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      const mediaUrl = await uploadMediaDataUrl(dataUrl, "promo", "ADMIN").catch(() => dataUrl);
      onChange(mediaUrl, mediaType);
    };
    reader.onerror = () => setError("Gagal membaca file media.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="mb-3 rounded-[16px] bg-cloud p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold uppercase text-slate-500">Media Promo</p>
          <p className="text-[10px] font-bold text-slate-400">Foto atau video pendek untuk customer</p>
        </div>
        <label htmlFor={inputId} className="cursor-pointer rounded-[10px] bg-navy px-3 py-2 text-[10px] font-extrabold text-white">
          Pilih Media
        </label>
      </div>
      {value ? (
        <div className="overflow-hidden rounded-[14px] bg-white">
          {type === "video" ? (
            <video src={value} className="h-36 w-full object-cover" controls muted playsInline />
          ) : (
            <img src={value} alt="Media promo" className="h-36 w-full object-cover" />
          )}
          <button type="button" className="w-full px-3 py-2 text-xs font-extrabold text-red-600" onClick={() => onChange("", null)}>
            Hapus Media
          </button>
        </div>
      ) : (
        <div className="flex min-h-[112px] items-center justify-center rounded-[14px] border border-dashed border-slate-300 bg-white text-center">
          <div>
            <Upload className="mx-auto h-6 w-6 text-slate-400" />
            <p className="mt-2 text-xs font-bold text-slate-500">Belum ada foto/video promo</p>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-[11px] font-bold text-red-600">{error}</p>}
      <input id={inputId} type="file" accept="image/*,video/*" className="hidden" onChange={(event) => void pick(event.target.files?.[0])} />
    </div>
  );
}

function EntityList({
  title,
  items,
  empty
}: {
  title: string;
  items: Array<string | { primary: string; secondary?: string }>;
  empty: string;
}) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-slate-100 p-3">
      <p className="mb-2 text-xs font-extrabold">{title}</p>
      <div className="grid gap-2">
        {items.length ? (
          items.slice(0, 6).map((item) => {
            const value = typeof item === "string" ? { primary: item } : item;
            return (
              <div key={`${value.primary}-${value.secondary ?? ""}`} className="min-w-0 overflow-hidden rounded-[12px] bg-cloud px-3 py-2">
                <p className="truncate text-[11px] font-extrabold text-slate-700">{value.primary}</p>
                {value.secondary && <p className="mt-0.5 truncate text-[10px] font-bold text-slate-500">{value.secondary}</p>}
              </div>
            );
          })
        ) : (
          <p className="text-xs text-slate-500">{empty}</p>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  action,
  children
}: {
  title: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-4 pt-5 sm:px-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold">{title}</h2>
        {action && <span className="text-xs font-bold text-flame">{action}</span>}
      </div>
      {children}
    </section>
  );
}

type GateRole = "CUSTOMER" | "PARTNER" | "ADMIN";
type GateMode = "login" | "register";

const gateCopy: Record<GateRole, { title: string; subtitle: string; registerTitle: string; endpoint: string; home: string; Icon: React.ElementType }> = {
  CUSTOMER: {
    title: "SERJAFAN Customer",
    subtitle: "Masuk untuk pesan jasa, bayar, chat SERJAFAN, dan tracking.",
    registerTitle: "Daftar Akun Customer",
    endpoint: "/api/register/customer",
    home: "/customer",
    Icon: Home
  },
  PARTNER: {
    title: "SERJAFAN Teknisi",
    subtitle: "Masuk sebagai teknisi jaringan SERJAFAN untuk menerima tugas operasional.",
    registerTitle: "Daftar Akun Teknisi",
    endpoint: "/api/register/partner",
    home: "/partner",
    Icon: Wrench
  },
  ADMIN: {
    title: "SERJAFAN Admin",
    subtitle: "Masuk sebagai admin tunggal untuk mengelola sistem.",
    registerTitle: "Daftar Admin Pertama",
    endpoint: "/api/register/admin",
    home: "/admin",
    Icon: ShieldCheck
  }
};

function RoleAuthGate({ role, onAuthenticated }: { role: GateRole; onAuthenticated: (session: StoredSession) => void }) {
  const copy = gateCopy[role];
  const registerPath = role === "PARTNER" ? "/register/partner" : role === "ADMIN" ? "/register/admin" : "/register/customer";
  const [mode, setMode] = useState<GateMode>("login");
  const [status, setStatus] = useState<{ kind: "idle" | "success" | "error"; message: string }>({ kind: "idle", message: "" });
  const [saving, setSaving] = useState(false);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    addressTitle: "",
    addressSubtitle: "Kota Padang, Sumatera Barat",
    profilePhoto: ""
  });
  const [partner, setPartner] = useState({
    ownerName: "",
    phone: "",
    email: "",
    password: "",
    businessName: "",
    category: "",
    serviceArea: "Kota Padang",
    businessAddress: "",
    priceFrom: "",
    servicePhoto: "",
    selfPhoto: "",
    ktpPhoto: "",
    portfolio: ""
  });
  const [admin, setAdmin] = useState({ name: "", email: "", password: "", profilePhoto: "" });

  const showStatus = (kind: "success" | "error", message: string) => setStatus({ kind, message });

  const submitLogin = async () => {
    setSaving(true);
    setStatus({ kind: "idle", message: "" });
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: login.email, password: login.password, role })
      });
      const payload = await parseJsonResponse(response);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Login gagal.");
      const session = payload.data.session as StoredSession;
      storeSession(session);
      showStatus("success", "Login sukses. Membuka beranda akun...");
      window.setTimeout(() => onAuthenticated(session), 350);
    } catch (error) {
      showStatus("error", error instanceof Error ? error.message : "Login gagal.");
    } finally {
      setSaving(false);
    }
  };

  const submitRegister = async () => {
    setSaving(true);
    setStatus({ kind: "idle", message: "" });
    try {
      const body =
        role === "CUSTOMER"
          ? customer
          : role === "PARTNER"
            ? { ...partner, priceFrom: Number(partner.priceFrom || 0) }
            : admin;
      const response = await fetch(copy.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await parseJsonResponse(response);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Pendaftaran gagal.");
      const email = role === "CUSTOMER" ? customer.email : role === "PARTNER" ? partner.email : admin.email;
      const password = role === "CUSTOMER" ? customer.password : role === "PARTNER" ? partner.password : admin.password;
      setLogin({ email, password: "" });
      showStatus("success", "Akun berhasil dibuat. Silakan login dengan ID/email dan sandi yang benar.");
      setMode("login");
      if (password) {
        window.setTimeout(() => setLogin((current) => ({ ...current, password: "" })), 100);
      }
    } catch (error) {
      showStatus("error", error instanceof Error ? error.message : "Pendaftaran gagal.");
    } finally {
      setSaving(false);
    }
  };

  const Icon = copy.Icon;

  return (
    <main className="min-h-screen bg-cloud px-5 py-6 text-slate-950">
      <div className="mx-auto max-w-[430px]">
        <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-extrabold text-navy">
          <ArrowLeft className="h-4 w-4" /> Pilih aplikasi
        </Link>
        <div className="overflow-hidden rounded-[22px] bg-white shadow-soft">
          <div className="bg-navy p-5 text-white">
            <div className="mb-5 flex items-center justify-between gap-3">
              <BrandMark light />
              <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white/10 text-white">
                <Icon className="h-6 w-6" />
              </span>
            </div>
            <p className="text-[11px] font-bold text-white/60">AKSES APLIKASI</p>
            <h1 className="mt-1 text-2xl font-extrabold">{copy.title}</h1>
            <p className="mt-2 text-sm leading-6 text-white/70">{copy.subtitle}</p>
          </div>

          <div className="grid gap-3 p-4">
            <div className="rounded-[16px] bg-orange-50 p-3">
              <p className="text-xs font-extrabold text-orange-800">Login akun {role === "PARTNER" ? "partner" : role === "ADMIN" ? "admin" : "customer"}</p>
              <p className="mt-1 text-[11px] leading-5 text-orange-700">
                Belum punya akun? Daftar dulu lewat tombol daftar, setelah selesai sistem kembali ke halaman login ini.
              </p>
            </div>
            <AuthField label="ID / Email" type="email" value={login.email} onChange={(email) => setLogin((current) => ({ ...current, email }))} />
            <AuthField label="Sandi / Password" type="password" value={login.password} onChange={(password) => setLogin((current) => ({ ...current, password }))} />

            {status.kind !== "idle" && (
              <div className={cn("rounded-[14px] p-3 text-sm font-bold", status.kind === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                {status.message}
              </div>
            )}

            <Button variant="orange" size="lg" disabled={saving} onClick={submitLogin}>
              <LogIn className="h-4 w-4" />
              {saving ? "Memeriksa..." : "Masuk Dashboard"}
            </Button>

            <Link
              href={registerPath}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border-2 border-navy text-sm font-extrabold text-navy"
            >
              <UserPlus className="h-4 w-4" />
              {role === "ADMIN" ? "Belum punya admin? Daftar admin pertama" : role === "PARTNER" ? "Belum punya akun? Daftar teknisi" : "Belum punya akun? Daftar"}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function RegisterFields({
  role,
  customer,
  partner,
  admin,
  setCustomer,
  setPartner,
  setAdmin
}: {
  role: GateRole;
  customer: any;
  partner: any;
  admin: any;
  setCustomer: React.Dispatch<React.SetStateAction<any>>;
  setPartner: React.Dispatch<React.SetStateAction<any>>;
  setAdmin: React.Dispatch<React.SetStateAction<any>>;
}) {
  if (role === "ADMIN") {
    return (
      <>
        <div className="rounded-[16px] bg-orange-50 p-3 text-[11px] leading-5 text-orange-700">
          <strong>Admin hanya satu.</strong> Pendaftar admin pertama menjadi pemilik akses admin.
        </div>
        <AuthField label="Nama Admin" value={admin.name} onChange={(name) => setAdmin((current: any) => ({ ...current, name }))} />
        <AuthField label="Email Admin" type="email" value={admin.email} onChange={(email) => setAdmin((current: any) => ({ ...current, email }))} />
        <AuthField label="Password" type="password" value={admin.password} onChange={(password) => setAdmin((current: any) => ({ ...current, password }))} />
        <AuthPhotoField label="Foto Profil Admin" value={admin.profilePhoto} onChange={(profilePhoto) => setAdmin((current: any) => ({ ...current, profilePhoto }))} />
      </>
    );
  }

  if (role === "PARTNER") {
    return (
      <>
        <AuthField label="Nama Pemilik" value={partner.ownerName} onChange={(ownerName) => setPartner((current: any) => ({ ...current, ownerName }))} />
        <AuthField label="Nomor HP Aktif" value={partner.phone} onChange={(phone) => setPartner((current: any) => ({ ...current, phone }))} />
        <AuthField label="Email" type="email" value={partner.email} onChange={(email) => setPartner((current: any) => ({ ...current, email }))} />
        <AuthField label="Password" type="password" value={partner.password} onChange={(password) => setPartner((current: any) => ({ ...current, password }))} />
        <div className="grid gap-3 sm:grid-cols-2">
          <AuthField label="Nama Usaha/Jasa" value={partner.businessName} onChange={(businessName) => setPartner((current: any) => ({ ...current, businessName }))} />
          <AuthField label="Kategori Jasa" value={partner.category} onChange={(category) => setPartner((current: any) => ({ ...current, category }))} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <AuthField label="Area Layanan" value={partner.serviceArea} onChange={(serviceArea) => setPartner((current: any) => ({ ...current, serviceArea }))} />
          <AuthField label="Harga Mulai" inputMode="numeric" value={partner.priceFrom} onChange={(priceFrom) => setPartner((current: any) => ({ ...current, priceFrom }))} />
        </div>
        <AuthField label="Alamat Usaha / Titik Operasional" value={partner.businessAddress} onChange={(businessAddress) => setPartner((current: any) => ({ ...current, businessAddress }))} />
        <AuthPhotoField label="Foto Jasa / Tempat Usaha" required value={partner.servicePhoto} onChange={(servicePhoto) => setPartner((current: any) => ({ ...current, servicePhoto }))} />
        <AuthPhotoField label="Foto Diri Pemilik" required value={partner.selfPhoto} onChange={(selfPhoto) => setPartner((current: any) => ({ ...current, selfPhoto }))} />
        <AuthPhotoField label="Foto KTP" required value={partner.ktpPhoto} onChange={(ktpPhoto) => setPartner((current: any) => ({ ...current, ktpPhoto }))} />
        <AuthPhotoField label="Portofolio / Contoh Hasil Kerja" value={partner.portfolio} onChange={(portfolio) => setPartner((current: any) => ({ ...current, portfolio }))} />
      </>
    );
  }

  return (
    <>
      <AuthField label="Nama Lengkap" value={customer.name} onChange={(name) => setCustomer((current: any) => ({ ...current, name }))} />
      <AuthField label="Nomor HP Aktif" value={customer.phone} onChange={(phone) => setCustomer((current: any) => ({ ...current, phone }))} />
      <AuthField label="Email" type="email" value={customer.email} onChange={(email) => setCustomer((current: any) => ({ ...current, email }))} />
      <AuthField label="Password" type="password" value={customer.password} onChange={(password) => setCustomer((current: any) => ({ ...current, password }))} />
      <AuthField label="Alamat Utama" value={customer.addressTitle} onChange={(addressTitle) => setCustomer((current: any) => ({ ...current, addressTitle }))} />
      <AuthField label="Keterangan Alamat" value={customer.addressSubtitle} onChange={(addressSubtitle) => setCustomer((current: any) => ({ ...current, addressSubtitle }))} />
      <AuthPhotoField label="Foto Profil Customer" value={customer.profilePhoto} onChange={(profilePhoto) => setCustomer((current: any) => ({ ...current, profilePhoto }))} />
    </>
  );
}

function AuthField({
  label,
  value,
  onChange,
  type = "text",
  inputMode
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: "text" | "numeric" | "decimal" | "email" | "tel" | "search" | "url";
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-extrabold uppercase text-slate-500">{label}</span>
      <Input value={value} type={type} inputMode={inputMode} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function AuthPhotoField({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  const [error, setError] = useState("");
  const inputId = `embedded-${label.replaceAll(" ", "-").replaceAll("/", "-").toLowerCase()}`;
  const cameraInputId = `${inputId}-camera`;
  const galleryInputId = `${inputId}-gallery`;

  const pick = async (file?: File) => {
    setError("");
    if (!file) return;
    try {
      const dataUrl = await imageFileToDataUrl(file);
      const purpose = label.toLowerCase().includes("ktp") || label.toLowerCase().includes("jasa") || label.toLowerCase().includes("portofolio")
        ? "partner-document"
        : label.toLowerCase().includes("bukti")
          ? "topup-proof"
          : "profile";
      onChange(await uploadMediaDataUrl(dataUrl, purpose).catch(() => dataUrl));
    } catch (photoError) {
      setError(photoError instanceof Error ? photoError.message : "Foto gagal dipilih.");
    }
  };

  return (
    <div className="grid gap-1.5">
      <span className="text-xs font-extrabold uppercase text-slate-500">
        {label} {required && <span className="text-flame">*</span>}
      </span>
      <div className="rounded-[16px] border border-dashed border-slate-200 bg-white p-3">
        {value ? (
          <div className="flex items-center gap-3">
            <img src={value} alt={label} className="h-16 w-16 rounded-[14px] object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold">Foto sudah dipilih</p>
              <p className="text-xs text-slate-500">Bisa diganti kalau belum jelas.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-orange-50 text-flame">
              <ImageIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-extrabold">Pilih foto langsung</p>
              <p className="text-xs text-slate-500">JPG/PNG maksimal 1.5 MB.</p>
            </div>
          </div>
        )}
        <input id={cameraInputId} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => void pick(event.target.files?.[0])} />
        <input id={galleryInputId} type="file" accept="image/*" className="hidden" onChange={(event) => void pick(event.target.files?.[0])} />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label htmlFor={cameraInputId} className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-navy px-3 text-xs font-extrabold text-white">
            <Camera className="h-4 w-4" /> Kamera
          </label>
          <label htmlFor={galleryInputId} className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[14px] border-2 border-navy bg-white px-3 text-xs font-extrabold text-navy">
            <Upload className="h-4 w-4" /> Galeri
          </label>
        </div>
        {value && (
          <Button type="button" variant="ghost" className="mt-2 text-red-600" onClick={() => onChange("")}>
            <X className="h-4 w-4" /> Hapus
          </Button>
        )}
        {error && <p className="mt-2 text-xs font-bold text-red-600">{error}</p>}
      </div>
    </div>
  );
}

async function imageFileToDataUrl(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("File harus berupa gambar.");
  if (file.size > 1_500_000) throw new Error("Ukuran foto maksimal 1.5 MB.");
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const maxSide = 720;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Foto gagal diproses.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise<string>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Foto gagal dikompres."));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Foto gagal dibaca."));
        reader.readAsDataURL(blob);
      },
      "image/jpeg",
      0.72
    );
  });
}

async function uploadMediaDataUrl(
  dataUrl: string,
  purpose: "profile" | "partner-document" | "topup-proof" | "chat" | "promo" | "ringtone",
  role?: "CUSTOMER" | "PARTNER" | "ADMIN"
) {
  const init = {
    method: "POST",
    body: JSON.stringify({ dataUrl, purpose })
  };
  const response = role ? await apiFetch("/api/uploads", role, init) : await fetch("/api/uploads", { ...init, headers: { "content-type": "application/json" } });
  const payload = (await parseJsonResponse(response)) as { data?: { upload?: { url?: string } }; error?: { message?: string } };
  if (!response.ok || !payload.data?.upload?.url) throw new Error(payload.error?.message || "Upload cloud belum siap.");
  return payload.data.upload.url;
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">{children}</div>;
}

function FormBlock({
  label,
  icon: Icon,
  title,
  note,
  onClick
}: {
  label: string;
  icon: React.ElementType;
  title: string;
  note: string;
  onClick?: () => void;
}) {
  return (
    <>
      <Label>{label}</Label>
      <button
        type="button"
        onClick={onClick}
        className="mb-3.5 flex w-full items-center gap-3 rounded-[14px] border border-slate-100 bg-white px-4 py-3.5 text-left shadow-[0_2px_12px_rgba(11,31,58,0.06)]"
      >
        <Icon className="h-5 w-5 shrink-0 text-flame" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold">{title}</p>
          <span className="block truncate text-[11px] text-slate-500">{note}</span>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
      </button>
    </>
  );
}

function PartnerOrder({
  icon: Icon,
  title,
  address,
  price,
  muted,
  onAccept
}: {
  icon: React.ElementType;
  title: string;
  address: string;
  price: string;
  muted?: boolean;
  onAccept?: () => void;
}) {
  return (
    <div className={cn("mb-3 rounded-[20px] border-l-4 border-flame bg-white p-4 shadow-soft", muted && "border-slate-400 opacity-60")}>
      <div className="mb-1.5 flex items-start justify-between gap-3">
        <span className="flex items-center gap-2 text-[13px] font-extrabold">
          <Icon className="h-4 w-4 text-flame" /> {title}
        </span>
        <span className="text-[13px] font-extrabold text-flame">{price}</span>
      </div>
      <p className="mb-3 text-xs text-slate-500">{address}</p>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 border-2 border-red-600 text-red-600">
          <X className="h-4 w-4" /> Tolak
        </Button>
        <Button variant="orange" className="flex-[2]" onClick={onAccept}>
          <Check className="h-4 w-4" /> Terima Pesanan
        </Button>
      </div>
    </div>
  );
}

function Toast({ kind, message }: { kind: ToastKind; message: string }) {
  return (
    <div className="fixed bottom-24 left-1/2 z-[80] w-[calc(100%-32px)] max-w-[388px] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-3 rounded-[16px] bg-white p-3 shadow-soft">
      <div className="flex items-start gap-2">
        {kind === "success" ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />}
        <p className={cn("text-xs font-bold", kind === "success" ? "text-emerald-700" : "text-red-700")}>{message}</p>
      </div>
    </div>
  );
}

function NotificationsDrawer({
  loading,
  items,
  onClose,
  onOpenSettings,
  onOpenOrders
}: {
  loading: boolean;
  items: NotificationItem[];
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenOrders: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] bg-navy/30 backdrop-blur-[2px]">
      <div className="absolute right-0 top-0 mobile-panel w-full max-w-[440px] bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-navy px-5 py-4 text-white">
          <div>
            <p className="text-[11px] font-bold text-white/65">PUSAT NOTIFIKASI</p>
            <h2 className="text-base font-extrabold">Lonceng</h2>
          </div>
          <Button size="icon" variant="ghost" className="rounded-xl bg-white/10 text-white hover:bg-white/20" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-4">
          <div className="mb-4 grid grid-cols-2 gap-2">
            <Button variant="outline" className="border-2 border-navy text-navy" onClick={onOpenOrders}>
              <ListOrdered className="h-4 w-4" /> Pesanan
            </Button>
            <Button variant="outline" className="border-2 border-flame text-flame" onClick={onOpenSettings}>
              <Bell className="h-4 w-4" /> Suara/Getar
            </Button>
          </div>
          {loading ? (
            <div className="space-y-3">
              <div className="h-16 animate-pulse rounded-[16px] bg-slate-100" />
              <div className="h-16 animate-pulse rounded-[16px] bg-slate-100" />
            </div>
          ) : items.length ? (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-[16px] bg-cloud p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.body}</p>
                    </div>
                    <Badge variant={item.kind === "promo" ? "orange" : "blue"}>{item.kind}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[16px] bg-cloud p-4 text-sm text-slate-500">Belum ada notifikasi.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessagesDrawerByService({
  role,
  loading,
  items,
  onClose,
  onSend
}: {
  role: "CUSTOMER" | "PARTNER" | "ADMIN";
  loading: boolean;
  items: MessageThread[];
  onClose: () => void;
  onSend: (text: string, attachmentImage?: string, orderId?: string | null) => void;
}) {
  const [draft, setDraft] = useState("");
  const [photo, setPhoto] = useState("");
  const [photoError, setPhotoError] = useState("");
  const quickReplies = ["Baik, saya cek dulu.", "Saya segera menuju lokasi.", "Bisa kirim detail alamat?", "Pesanan sudah saya terima."];
  const groupedThreads = useMemo(() => {
    const groups = new Map<string, { key: string; orderId?: string | null; title: string; subtitle: string; unread: number; latest?: MessageThread; messages: MessageThread[] }>();
    for (const item of items) {
      const key = item.orderId || item.partnerId || item.title || "general";
      const group = groups.get(key) ?? {
        key,
        orderId: item.orderId,
        title: item.serviceName && item.partnerName ? `${item.serviceName} - ${item.partnerName}` : item.title,
        subtitle: item.orderId ? `Pesanan ${item.orderId}` : "Chat jasa",
        unread: 0,
        latest: undefined,
        messages: []
      };
      group.messages.push(item);
      if (item.unread) group.unread += 1;
      if (!group.latest || new Date(item.createdAt ?? 0).getTime() > new Date(group.latest.createdAt ?? 0).getTime()) group.latest = item;
      groups.set(key, group);
    }
    return Array.from(groups.values()).sort((a, b) => new Date(b.latest?.createdAt ?? 0).getTime() - new Date(a.latest?.createdAt ?? 0).getTime());
  }, [items]);
  const [activeKey, setActiveKey] = useState("");
  const activeThread = groupedThreads.find((thread) => thread.key === activeKey) ?? groupedThreads[0];
  const activeMessages = (activeThread?.messages ?? []).slice().sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());

  useEffect(() => {
    if (!groupedThreads.length) {
      setActiveKey("");
      return;
    }
    if (!activeKey || !groupedThreads.some((thread) => thread.key === activeKey)) setActiveKey(groupedThreads[0].key);
  }, [activeKey, groupedThreads]);

  const pickChatPhoto = async (file?: File) => {
    setPhotoError("");
    if (!file) return;
    try {
      const dataUrl = await imageFileToDataUrl(file);
      setPhoto(await uploadMediaDataUrl(dataUrl, "chat", role).catch(() => dataUrl));
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "Foto gagal dipilih.");
    }
  };

  const submit = () => {
    if (!activeThread?.orderId) {
      setPhotoError("Pilih kotak pesan pesanan/jasa dulu supaya chat tidak tercampur.");
      return;
    }
    onSend(draft.trim(), photo || undefined, activeThread.orderId);
    setDraft("");
    setPhoto("");
  };

  return (
    <div className="fixed inset-0 z-[90] bg-navy/30 backdrop-blur-[2px]">
      <div className="absolute right-0 top-0 mobile-panel w-full max-w-[440px] bg-white shadow-2xl">
        <div className="bg-[#0648bd] px-5 pb-8 pt-5 text-white">
          <div className="mb-5 flex items-center justify-between">
            <BrandMark light />
            <button type="button" className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-bold">
              <MapPin className="h-4 w-4" /> Padang
            </button>
          </div>
          <div className="flex items-center justify-between">
          <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/65">Inbox</p>
              <h2 className="text-2xl font-black">Chat</h2>
          </div>
            <Button size="icon" variant="ghost" className="rounded-xl bg-white/10 text-white hover:bg-white/20" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          </div>
        </div>
        <div className="-mt-5 flex h-[calc(100%-120px)] flex-col rounded-t-[24px] bg-[#f7faff] p-4">
          <div className="mb-3 flex items-center gap-2 rounded-[18px] bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef5ff] text-[#075bdd]">
              <MessageCircle className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">{activeThread?.title ?? "Ruang Chat SERJAFAN"}</p>
              <p className="truncate text-[11px] font-bold text-[#075bdd]">{activeThread?.subtitle ?? "Chat dipisah per jasa dan pesanan"}</p>
            </div>
          </div>
          {loading ? (
            <div className="space-y-3 overflow-y-auto">
              <div className="h-16 animate-pulse rounded-[16px] bg-slate-100" />
              <div className="h-16 animate-pulse rounded-[16px] bg-slate-100" />
            </div>
          ) : groupedThreads.length ? (
            <>
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                {groupedThreads.map((thread) => (
                  <button
                    key={thread.key}
                    type="button"
                    onClick={() => setActiveKey(thread.key)}
                    className={cn("min-w-[190px] rounded-[16px] p-3 text-left text-xs shadow-sm", activeThread?.key === thread.key ? "bg-[#075bdd] text-white" : "bg-white text-slate-700")}
                  >
                    <span className="block truncate font-extrabold">{thread.title}</span>
                    <span className={cn("mt-1 block truncate", activeThread?.key === thread.key ? "text-white/65" : "text-slate-500")}>{thread.subtitle}</span>
                    {thread.unread > 0 && <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">{thread.unread} baru</span>}
                  </button>
                ))}
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto rounded-[18px] bg-white p-2 shadow-inner">
                {activeMessages.map((item) => (
                  <div key={item.id} className={cn("flex", item.sender === "Saya" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[82%] rounded-2xl px-3 py-2 shadow-sm", item.sender === "Saya" ? "rounded-br-sm bg-[#dbeafe] text-slate-900" : "rounded-bl-sm bg-white text-slate-800 ring-1 ring-slate-100")}>
                      <div className="mb-1 flex items-center gap-2">
                        <p className="text-[11px] font-extrabold opacity-80">{item.sender}</p>
                        {item.unread && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">Baru</span>}
                      </div>
                      {item.attachmentImage && <img src={item.attachmentImage} alt="Lampiran chat" className="mb-2 max-h-56 rounded-[14px] object-cover" />}
                      <p className="text-sm leading-5">{item.body}</p>
                      <p className={cn("mt-1 text-right text-[9px]", item.sender === "Saya" ? "text-[#075bdd]" : "text-slate-400")}>Terkirim</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 rounded-[16px] bg-white p-4 text-sm text-slate-500">Belum ada kotak pesan. Chat akan muncul setelah ada pesanan jasa tertentu.</div>
          )}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {quickReplies.map((reply) => (
              <button key={reply} type="button" onClick={() => setDraft(reply)} className="shrink-0 rounded-full bg-white px-3 py-2 text-[11px] font-bold text-[#075bdd] shadow-sm">
                {reply}
              </button>
            ))}
          </div>
          {photo && (
            <div className="mt-2 flex items-center gap-3 rounded-[16px] bg-white p-2 shadow-sm">
              <img src={photo} alt="Foto yang akan dikirim" className="h-14 w-14 rounded-[12px] object-cover" />
              <p className="flex-1 text-xs font-bold text-slate-600">Foto siap dikirim ke kotak pesan ini.</p>
              <Button size="icon" variant="ghost" className="text-red-600" onClick={() => setPhoto("")}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {photoError && <p className="mt-2 rounded-[12px] bg-red-50 p-2 text-xs font-bold text-red-600">{photoError}</p>}
          <div className="mt-2 flex gap-2 rounded-[18px] bg-white p-2 shadow-soft">
            <input id="chat-photo-camera" type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => void pickChatPhoto(event.target.files?.[0])} />
            <input id="chat-photo-gallery" type="file" accept="image/*" className="hidden" onChange={(event) => void pickChatPhoto(event.target.files?.[0])} />
            <label htmlFor="chat-photo-gallery" className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-[14px] bg-[#eef5ff] text-[#075bdd]">
              <ImageIcon className="h-4 w-4" />
            </label>
            <label htmlFor="chat-photo-camera" className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-[14px] bg-[#eef5ff] text-[#075bdd]">
              <Camera className="h-4 w-4" />
            </label>
            <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Tulis pesan..." className="border-0 bg-transparent shadow-none focus-visible:ring-0" />
            <Button className="rounded-full bg-[#075bdd] text-white hover:bg-[#0648bd]" disabled={!draft.trim() && !photo} onClick={submit}>
              Kirim
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessagesDrawer({
  loading,
  items,
  onClose,
  onSend
}: {
  loading: boolean;
  items: MessageThread[];
  onClose: () => void;
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const quickReplies = ["Baik, saya cek dulu.", "Saya segera menuju lokasi.", "Bisa kirim detail alamat?", "Pesanan sudah saya terima."];

  return (
    <div className="fixed inset-0 z-[90] bg-navy/30 backdrop-blur-[2px]">
      <div className="absolute right-0 top-0 mobile-panel w-full max-w-[440px] bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-navy px-5 py-4 text-white">
          <div>
            <p className="text-[11px] font-bold text-white/65">INBOX</p>
            <h2 className="text-base font-extrabold">Pesan</h2>
          </div>
          <Button size="icon" variant="ghost" className="rounded-xl bg-white/10 text-white hover:bg-white/20" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex h-[calc(100%-72px)] flex-col bg-[#eef7f1] p-4">
          <div className="mb-3 flex items-center gap-2 rounded-[16px] bg-white p-3 shadow-soft">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <MessageCircle className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-extrabold">Ruang Chat SERJAFAN</p>
              <p className="text-[11px] font-bold text-emerald-700">Online • terenkripsi aplikasi</p>
            </div>
          </div>
          {loading ? (
            <div className="space-y-3 overflow-y-auto">
              <div className="h-16 animate-pulse rounded-[16px] bg-slate-100" />
              <div className="h-16 animate-pulse rounded-[16px] bg-slate-100" />
            </div>
          ) : items.length ? (
            <div className="flex-1 space-y-3 overflow-y-auto rounded-[18px] bg-white/40 p-2">
              {items.map((item) => (
                <div key={item.id} className={cn("flex", item.sender === "Saya" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[82%] rounded-2xl px-3 py-2 shadow-sm", item.sender === "Saya" ? "rounded-br-sm bg-emerald-600 text-white" : "rounded-bl-sm bg-white text-slate-800")}>
                    <div className="mb-1 flex items-center gap-2">
                      <p className="text-[11px] font-extrabold opacity-80">{item.sender}</p>
                      {item.unread && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">Baru</span>}
                    </div>
                    <p className="text-sm leading-5">{item.body}</p>
                    <p className={cn("mt-1 text-right text-[9px]", item.sender === "Saya" ? "text-white/70" : "text-slate-400")}>Terkirim</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 rounded-[16px] bg-white/70 p-4 text-sm text-slate-500">Belum ada pesan masuk.</div>
          )}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {quickReplies.map((reply) => (
              <button key={reply} type="button" onClick={() => setDraft(reply)} className="shrink-0 rounded-full bg-white px-3 py-2 text-[11px] font-bold text-navy shadow-sm">
                {reply}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2 rounded-[18px] bg-white p-2 shadow-soft">
            <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Tulis pesan..." className="border-0 bg-transparent shadow-none focus-visible:ring-0" />
            <Button
              variant="orange"
              disabled={!draft.trim()}
              onClick={() => {
                onSend(draft);
                setDraft("");
              }}
            >
              Kirim
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationSettingsDrawer({
  role,
  preferences,
  permission,
  onRequestPermission,
  onSave,
  onTest,
  onClose
}: {
  role: "CUSTOMER" | "PARTNER" | "ADMIN";
  preferences: NotificationPreferences;
  permission: NotificationPermission | "unsupported";
  onRequestPermission: () => void;
  onSave: (preferences: NotificationPreferences) => void;
  onTest: (preferences: NotificationPreferences) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<NotificationPreferences>(preferences);

  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);

  const toneOptions: Array<{ value: NotificationPreferences["soundTone"]; label: string; description: string }> = [
    { value: "classic", label: "Classic", description: "Nada lonceng standar SERJAFAN." },
    { value: "soft", label: "Soft", description: "Lebih halus untuk pemakaian indoor." },
    { value: "urgent", label: "Urgent", description: "Lebih tegas untuk pesanan masuk." },
    { value: "custom", label: "Custom", description: draft.customRingtoneName ? `Nada pribadi: ${draft.customRingtoneName}` : "Impor lagu atau nada sendiri." }
  ];

  const importRingtone = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("audio/")) return;
    if (file.size > 2_500_000) {
      alert("Ukuran nada maksimal 2.5 MB. Pilih potongan nada/lagu pendek agar cepat dipakai di HP.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      setDraft((current) => ({
        ...current,
        soundTone: "custom",
        customRingtoneName: file.name,
        customRingtoneData: dataUrl
      }));
      const storedUrl = await uploadMediaDataUrl(dataUrl, "ringtone", role).catch(() => dataUrl);
      setDraft((current) => ({
        ...current,
        soundTone: "custom",
        customRingtoneName: file.name,
        customRingtoneData: storedUrl
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[95] bg-navy/30 backdrop-blur-[2px]">
      <div className="absolute right-0 top-0 mobile-panel w-full max-w-[440px] bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-navy px-5 py-4 text-white">
          <div>
            <p className="text-[11px] font-bold text-white/65">PENGATURAN AKUN</p>
            <h2 className="text-base font-extrabold">Suara dan Getar</h2>
          </div>
          <Button size="icon" variant="ghost" className="rounded-xl bg-white/10 text-white hover:bg-white/20" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-3 p-4">
          <div className="rounded-[18px] bg-cloud p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold">Bunyi Notifikasi</p>
                <p className="mt-1 text-xs text-slate-500">Untuk lonceng, pesan, pesanan masuk, dan telepon.</p>
              </div>
              <Switch checked={draft.soundEnabled} onCheckedChange={(soundEnabled) => setDraft((current) => ({ ...current, soundEnabled }))} />
            </div>
          </div>
          <div className="rounded-[18px] bg-cloud p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold">Getar HP</p>
                <p className="mt-1 text-xs text-slate-500">Aktif jika browser dan perangkat mendukung getar.</p>
              </div>
              <Switch checked={draft.vibrationEnabled} onCheckedChange={(vibrationEnabled) => setDraft((current) => ({ ...current, vibrationEnabled }))} />
            </div>
          </div>
          <div className="rounded-[18px] bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold">Notifikasi Layar HP</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {permission === "granted"
                    ? "Aktif. Notifikasi tampil saat aplikasi terbuka atau berjalan di background/PWA."
                    : permission === "denied"
                      ? "Tertolak. Buka pengaturan browser HP lalu izinkan notifikasi untuk SERJAFAN."
                      : permission === "unsupported"
                        ? "Browser ini belum mendukung notifikasi layar."
                        : "Belum diizinkan. Tekan aktifkan agar pesanan, chat, dan lonceng tampil di layar HP."}
                </p>
              </div>
              <Badge variant={permission === "granted" ? "success" : permission === "denied" ? "orange" : "warning"}>
                {permission === "granted" ? "Aktif" : permission === "denied" ? "Tertolak" : permission === "unsupported" ? "Tidak Ada" : "Belum"}
              </Badge>
            </div>
            <Button variant="outline" className="mt-3 w-full border-2 border-navy text-navy" disabled={permission === "granted" || permission === "unsupported"} onClick={onRequestPermission}>
              <Bell className="h-4 w-4" /> Aktifkan Notifikasi Layar
            </Button>
          </div>
          <div className="rounded-[18px] bg-white p-3 shadow-soft">
            <p className="mb-2 text-xs font-extrabold uppercase text-slate-500">Nada Notifikasi</p>
            <div className="grid gap-2">
              {toneOptions.map((tone) => (
                <button
                  key={tone.value}
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, soundTone: tone.value }))}
                  className={cn(
                    "rounded-[14px] border-2 p-3 text-left transition",
                    draft.soundTone === tone.value ? "border-flame bg-orange-50" : "border-slate-100 bg-white"
                  )}
                >
                  <p className="text-sm font-extrabold">{tone.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{tone.description}</p>
                </button>
              ))}
            </div>
            <div className="mt-3 rounded-[16px] border border-dashed border-slate-200 bg-cloud p-3">
              <p className="text-xs font-extrabold text-navy">Custom Nada Dering</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">Tekan tombol di bawah, pilih audio dari My Music/File HP, lalu simpan. Format MP3/M4A/WAV maksimal 2.5 MB.</p>
              <input id="ringtone-upload" type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac" className="hidden" onChange={(event) => void importRingtone(event.target.files?.[0])} />
              <label htmlFor="ringtone-upload" className="mt-3 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-navy px-4 text-xs font-extrabold text-white">
                <Upload className="h-4 w-4" /> Buka Musik / Pilih Nada
              </label>
              {draft.customRingtoneName && <p className="mt-2 text-xs font-bold text-emerald-700">Aktif: {draft.customRingtoneName}</p>}
            </div>
            <p className="mt-3 rounded-[14px] bg-amber-50 p-3 text-[11px] font-bold leading-5 text-amber-700">
              Agar notifikasi muncul di layar HP, izinkan notifikasi browser dan pasang SERJAFAN ke layar utama. Jika website ditutup total, notifikasi penuh membutuhkan Web Push server.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="border-2 border-navy text-navy" onClick={() => onTest(draft)}>
              <Bell className="h-4 w-4" /> Tes
            </Button>
            <Button variant="orange" onClick={() => onSave(draft)}>
              <Check className="h-4 w-4" /> Simpan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneDrawer({
  role,
  partner,
  onClose
}: {
  role: "CUSTOMER" | "PARTNER" | "ADMIN";
  partner: Partner;
  onClose: () => void;
}) {
  const target = role === "CUSTOMER" ? "SERJAFAN Support" : "Customer aktif";
  const phone = role === "CUSTOMER" ? partner.phone || "Nomor support SERJAFAN belum diatur" : "Nomor customer tersedia di detail pesanan";
  const canCall = phone.startsWith("+") || phone.startsWith("08");
  const [calling, setCalling] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!calling) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [calling]);

  const callTime = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-[90] bg-navy/30 backdrop-blur-[2px]">
      <div className="absolute right-0 top-0 mobile-panel w-full max-w-[440px] bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-navy px-5 py-4 text-white">
          <div>
            <p className="text-[11px] font-bold text-white/65">MENU TELEPON</p>
            <h2 className="text-base font-extrabold">{target}</h2>
          </div>
          <Button size="icon" variant="ghost" className="rounded-xl bg-white/10 text-white hover:bg-white/20" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-4">
          <div className="rounded-[22px] bg-gradient-to-br from-navy to-[#1b4d74] p-5 text-center text-white">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-2xl font-extrabold">
              {target.slice(0, 2).toUpperCase()}
            </span>
            <p className="mt-3 text-xs font-bold text-white/60">PANGGILAN SERJAFAN</p>
            <h3 className="mt-1 text-xl font-extrabold">{target}</h3>
            <p className="mt-1 text-sm text-white/70">{calling ? `Terhubung • ${callTime}` : phone}</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {["Mute", "Speaker", "Catatan"].map((item) => (
                <button key={item} type="button" className="rounded-[14px] bg-white/10 px-2 py-3 text-[11px] font-bold text-white">
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            <a
              href={canCall ? `tel:${phone.replaceAll(" ", "")}` : undefined}
              onClick={() => canCall && setCalling(true)}
              className={cn(
                "inline-flex h-12 items-center justify-center gap-2 rounded-[18px] px-8 text-sm font-bold text-white",
                canCall ? "bg-emerald-600" : "bg-slate-400"
              )}
            >
              <Phone className="h-4 w-4" /> {calling ? "Panggilan Berjalan" : "Hubungi Sekarang"}
            </a>
            <Button variant="outline" className="border-2 border-red-600 text-red-600" onClick={() => (calling ? setCalling(false) : onClose())}>
              {calling ? "Akhiri Panggilan" : "Tutup"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchDrawer({
  query,
  onQueryChange,
  services,
  partners,
  onClose,
  onSelectPartner
}: {
  query: string;
  onQueryChange: (value: string) => void;
  services: ServiceItem[];
  partners: PartnerItem[];
  onClose: () => void;
  onSelectPartner: (partner: Partner) => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] bg-navy/30 backdrop-blur-[2px]">
      <div className="absolute right-0 top-0 mobile-panel w-full max-w-[440px] bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-navy px-5 py-4 text-white">
          <div>
            <p className="text-[11px] font-bold text-white/65">PENCARIAN</p>
            <h2 className="text-base font-extrabold">Cari layanan SERJAFAN</h2>
          </div>
          <Button size="icon" variant="ghost" className="rounded-xl bg-white/10 text-white hover:bg-white/20" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3 rounded-[14px] border border-slate-100 bg-white px-4 py-3 shadow-soft">
            <Search className="h-5 w-5 text-flame" />
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Ketik untuk mencari..."
              className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="mt-4">
            <h3 className="mb-2 text-sm font-extrabold">Layanan</h3>
            <div className="grid gap-2">
              {services.map((service) => (
                <div key={service.name} className="rounded-[14px] bg-cloud p-3">
                  <p className="text-sm font-bold">{service.name}</p>
                  <p className="text-xs text-slate-500">{service.tone.replace("bg-", "").replace(" text-", " ")}</p>
                </div>
              ))}
              {!services.length && <p className="text-xs text-slate-500">Tidak ada layanan yang cocok.</p>}
            </div>
          </div>

          <div className="mt-4">
            <h3 className="mb-2 text-sm font-extrabold">Layanan Siap Diproses SERJAFAN</h3>
            <div className="grid gap-2">
              {partners.map((partner) => (
                <button
                  key={partner.id}
                  type="button"
                  onClick={() => onSelectPartner(partner)}
                  className="flex items-center justify-between rounded-[14px] bg-cloud p-3 text-left"
                >
                  <div>
                    <p className="text-sm font-bold">{partner.category}</p>
                    <p className="text-xs text-slate-500">
                      SERJAFAN menugaskan teknisi internal - {partner.distance}
                    </p>
                  </div>
                  <Badge variant={partner.status === "Online" ? "success" : "warning"}>{partner.status}</Badge>
                </button>
              ))}
              {!partners.length && <p className="text-xs text-slate-500">Belum ada layanan SERJAFAN yang cocok.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileDrawer({
  user,
  onClose,
  onOpenOrders,
  onOpenNotifications
}: {
  user: CurrentUser;
  onClose: () => void;
  onOpenOrders: () => void;
  onOpenNotifications: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] bg-navy/30 backdrop-blur-[2px]">
      <div className="absolute right-0 top-0 mobile-panel w-full max-w-[440px] bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-navy px-5 py-4 text-white">
          <div>
            <p className="text-[11px] font-bold text-white/65">PROFIL</p>
            <h2 className="text-base font-extrabold">{user.name}</h2>
          </div>
          <Button size="icon" variant="ghost" className="rounded-xl bg-white/10 text-white hover:bg-white/20" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-4">
          <Card className="rounded-[18px] border-slate-100">
            <CardContent className="p-4">
              <p className="text-[11px] font-bold text-slate-500">Dompet SERJAFAN Pay</p>
              <p className="mt-1 text-3xl font-extrabold">Rp {formatRupiah(user.walletBalance)}</p>
              <p className="mt-1 text-xs text-slate-500">{user.location}</p>
            </CardContent>
          </Card>
          <div className="mt-4 grid gap-2">
            <Button variant="outline" className="justify-start border-2 border-navy text-navy" onClick={onOpenOrders}>
              <ShoppingBag className="h-4 w-4" /> Pesanan saya
            </Button>
            <Button variant="outline" className="justify-start border-2 border-navy text-navy" onClick={onOpenNotifications}>
              <Bell className="h-4 w-4" /> Notifikasi
            </Button>
            <Button variant="outline" className="justify-start border-2 border-navy text-navy" onClick={onClose}>
              <UserCircle className="h-4 w-4" /> Pengaturan profil
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BottomNav({
  active,
  unreadMessages,
  onNavigate,
  onOpenMessages,
  onOpenProfile
}: {
  active: Screen;
  unreadMessages: number;
  onNavigate: (screen: Screen) => void;
  onOpenMessages: () => void;
  onOpenProfile: () => void;
}) {
  const items = [
    { label: "Beranda", Icon: Home, screen: "home" as Screen },
    { label: "Pesanan", Icon: ShoppingBag, screen: "orders" as Screen },
    { label: "Chat", Icon: MessageCircle, action: onOpenMessages },
    { label: "Akun", Icon: UserCircle, action: onOpenProfile }
  ];

  return (
    <nav className="safe-b layout-lock fixed bottom-0 left-1/2 z-50 grid w-full max-w-[440px] -translate-x-1/2 grid-cols-4 border-t border-slate-100 bg-white px-3 pt-2 shadow-[0_-6px_24px_rgba(11,31,58,0.08)]">
      {items.map(({ label, Icon, screen, action }) => {
        const selected = screen ? active === screen : label === "Akun" && active === "profile";
        return (
        <button
          key={label}
          type="button"
          onClick={() => (action ? action() : onNavigate(screen as Screen))}
          className={cn("tap-target relative flex min-w-0 flex-col items-center justify-center gap-1 px-2 text-[11px] font-bold", selected ? "text-[#075bdd]" : "text-slate-500")}
        >
          {label === "Chat" && unreadMessages > 0 && <span className="absolute right-[30%] top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">{Math.min(unreadMessages, 9)}</span>}
          <Icon className={cn("h-6 w-6", selected && "fill-[#075bdd]/10")} />
          <span className="truncate">{label}</span>
        </button>
        );
      })}
    </nav>
  );
}


