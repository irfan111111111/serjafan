"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Bike,
  Bolt,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  Heart,
  Home,
  KeyRound,
  Loader2,
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
  ListOrdered,
  UserCircle,
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
  | "transfer"
  | "walletHistory"
  | "editProfile"
  | "partner"
  | "partnerAccount"
  | "admin";
type PayMethod = "SERJAFAN Pay" | "Kartu Kredit" | "Tunai";
type PromoStatus = "idle" | "valid" | "invalid";
type ToastKind = "success" | "error";
type AppRole = "customer" | "partner" | "admin" | "switcher";
type FulfillmentMode = "PARTNER_TO_CUSTOMER" | "CUSTOMER_TO_PARTNER";

type CurrentUser = {
  id: string;
  name: string;
  location: string;
  walletBalance: number;
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
};

type MessageThread = {
  id: string;
  title: string;
  body: string;
  sender: string;
  unread: boolean;
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
    promos: { code: string; discount: number; active: boolean; note: string }[];
    partnerRequirements: { id: string; label: string; required: boolean }[];
    partnerFeatureCopy: { headline: string; description: string };
    customerFeatureCopy: { headline: string; description: string };
  };
  customers: any[];
  partners: any[];
};

type AdminSettings = {
  platformFee: number;
  promoCode: string;
  promoDiscount: number;
  serviceArea: string;
  supportPhone: string;
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
  if (normalized.includes("sepatu") || normalized.includes("clean")) return Sparkles;
  if (normalized.includes("jastip")) return ShoppingBag;
  if (normalized.includes("salon")) return Star;
  if (normalized.includes("foto") || normalized.includes("print") || normalized.includes("copy")) return ListOrdered;
  if (normalized.includes("kipas") || normalized.includes("ac") || normalized.includes("servis")) return Wrench;
  return Bolt;
};

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
  { value: "partner", label: "Partner" },
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
  partner: "SERJAFAN Partner",
  admin: "SERJAFAN Admin",
  switcher: "SERJAFAN"
};

const initialAdminSettings: AdminSettings = {
  platformFee: 3000,
  promoCode: "",
  promoDiscount: 0,
  serviceArea: "Kota Padang",
  supportPhone: "+62xxxxxxxxxx"
};

const initialAdminConsole: AdminConsoleData = {
  settings: {
    services: [],
    promos: [],
    partnerRequirements: [],
    partnerFeatureCopy: { headline: "Gabung Partner SERJAFAN", description: "" },
    customerFeatureCopy: { headline: "Customer App", description: "" }
  },
  customers: [],
  partners: []
};

const formatRupiah = (value: number) => new Intl.NumberFormat("id-ID").format(value);
const orderTotal = (draft: OrderDraft) => Math.max(0, draft.serviceFee + draft.platformFee - draft.discount);
const getPartnerMapPoint = (partnerId?: string | null) => partnerMapPoints[partnerId ?? ""] ?? partnerMapPoints.default;
const getPartnerByOrder = (order?: any, fallback?: Partner) => partners.find((partner) => partner.id === (order?.partnerId ?? order?.partner?.id)) ?? fallback ?? emptyPartner;
const routeForOrder = (order?: any, fallbackPartner?: Partner, mode: FulfillmentMode = "PARTNER_TO_CUSTOMER"): ConnectedRoute => {
  const partner = getPartnerByOrder(order, fallbackPartner);
  const customerPoint = {
    ...customerMapPoint,
    address: [order?.addressTitle, order?.addressSubtitle].filter(Boolean).join(", ") || customerMapPoint.address
  };
  const partnerPoint = getPartnerMapPoint(partner.id);

  return {
    origin: mode === "PARTNER_TO_CUSTOMER" ? partnerPoint : customerPoint,
    destination: mode === "PARTNER_TO_CUSTOMER" ? customerPoint : partnerPoint,
    status: order?.status ?? "ACTIVE",
    eta: partner.eta
  };
};

const googleMapsDirectionsUrl = (route: ConnectedRoute) => {
  const origin = `${route.origin.lat},${route.origin.lng}`;
  const destination = `${route.destination.lat},${route.destination.lng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
};

const demoActors: Record<"CUSTOMER" | "PARTNER" | "ADMIN", { userId: string }> = {
  CUSTOMER: { userId: "usr_customer_session" },
  PARTNER: { userId: "usr_partner_session" },
  ADMIN: { userId: "usr_admin_serjafan" }
};

async function apiFetch(path: string, role: "CUSTOMER" | "PARTNER" | "ADMIN", init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("x-serjafan-role", role);
  headers.set("x-serjafan-user-id", demoActors[role].userId);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return fetch(path, { ...init, headers });
}

async function readApi<T>(path: string, role: "CUSTOMER" | "PARTNER" | "ADMIN") {
  const response = await apiFetch(path, role);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return (await response.json()) as { data: T };
}

export default function HomePage() {
  return <AppLauncher />;
}

export function AppLauncher() {
  const apps = [
    {
      href: "/customer",
      title: "SERJAFAN Customer",
      description: "Aplikasi pelanggan untuk cari layanan, pesan mitra, bayar, dan tracking.",
      Icon: Home,
      tone: "bg-blue-50 text-blue-700"
    },
    {
      href: "/partner",
      title: "SERJAFAN Partner",
      description: "Aplikasi mitra untuk status online, menerima pesanan, dan mengelola pekerjaan.",
      Icon: Wrench,
      tone: "bg-emerald-50 text-emerald-700"
    },
    {
      href: "/admin",
      title: "SERJAFAN Admin",
      description: "Dashboard operasional untuk memantau sistem, verifikasi mitra, dan edit konfigurasi.",
      Icon: ShieldCheck,
      tone: "bg-orange-50 text-orange-700"
    }
  ];

  return (
    <main className="min-h-screen bg-cloud px-5 py-8 text-slate-950">
      <div className="mx-auto max-w-[760px]">
        <div className="mb-6 rounded-[18px] bg-navy p-5 text-white shadow-soft">
          <p className="text-xs font-bold text-white/65">SERJAFAN SUPER APP</p>
          <h1 className="mt-1 text-2xl font-extrabold">Pilih aplikasi</h1>
          <p className="mt-2 text-sm text-white/70">Customer, Partner, dan Admin sekarang dipisah sebagai aplikasi sendiri.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {apps.map(({ href, title, description, Icon, tone }) => (
            <Link key={href} href={href} className="rounded-[16px] bg-white p-4 shadow-soft transition hover:-translate-y-0.5">
              <span className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-[14px]", tone)}>
                <Icon className="h-6 w-6" />
              </span>
              <h2 className="text-base font-extrabold">{title}</h2>
              <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
              <span className="mt-4 flex items-center gap-1 text-xs font-extrabold text-flame">
                Buka aplikasi <ChevronRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

export function SerjafanApp({ appRole = "switcher" }: { appRole?: AppRole }) {
  const [screen, setScreen] = useState<Screen>(initialScreenByRole[appRole]);
  const [currentPartner, setCurrentPartner] = useState<Partner>(emptyPartner);
  const [orderDraft, setOrderDraft] = useState<OrderDraft>(initialDraft);
  const [lastOrder, setLastOrder] = useState<LastOrder | null>(null);
  const [partnerOnline, setPartnerOnline] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ kind: ToastKind; message: string } | null>(null);
  const [drawer, setDrawer] = useState<null | "notifications" | "messages" | "phone" | "search" | "profile">(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [messages, setMessages] = useState<MessageThread[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerServices, setCustomerServices] = useState<ServiceItem[]>(services);
  const [customerPartners, setCustomerPartners] = useState<Partner[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [partnerOrders, setPartnerOrders] = useState<any[]>([]);
  const [adminLiveOrders, setAdminLiveOrders] = useState<any[]>([]);
  const [adminMapData, setAdminMapData] = useState<AdminMapData>({ pairs: [], summary: { monitoredOrders: 0, monitoredCustomers: 0, monitoredPartners: 0 } });
  const [adminConsole, setAdminConsole] = useState<AdminConsoleData>(initialAdminConsole);
  const [pendingPartners, setPendingPartners] = useState<any[]>([]);
  const [adminDashboard, setAdminDashboard] = useState<{ revenueMonth: number; totalOrders: number; activePartners: number; activeCustomers: number } | null>(null);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(initialAdminSettings);
  const [loadingPanel, setLoadingPanel] = useState<"notifications" | "messages" | "orders" | "partnerOrders" | "admin" | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const showRoleTabs = appRole === "switcher";
  const showBottomNav = useMemo(() => appRole === "customer" || (appRole === "switcher" && !["partner", "admin"].includes(screen)), [appRole, screen]);
  const activeRoleTab = screen === "partner" || screen === "admin" ? screen : "home";
  const role: "CUSTOMER" | "PARTNER" | "ADMIN" =
    screen === "partner" ? "PARTNER" : screen === "admin" ? "ADMIN" : "CUSTOMER";
  const goTo = (next: Screen) => {
    if (appRole === "customer" && (next === "partner" || next === "admin")) return;
    if (appRole === "partner" && next !== "partner" && next !== "partnerAccount" && next !== "tracking") return;
    if (appRole === "admin" && next !== "admin") return;
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const notify = (kind: ToastKind, message: string) => {
    setToast({ kind, message });
    window.setTimeout(() => setToast(null), 3200);
  };

  const openNotifications = async () => {
    setDrawer("notifications");
    setLoadingPanel("notifications");
    try {
      const data = await readApi<{ notifications: NotificationItem[] }>("/api/notifications", role);
      setNotifications(data.data.notifications);
    } catch {
      notify("error", "Gagal memuat notifikasi.");
    } finally {
      setLoadingPanel(null);
    }
  };

  const openMessages = async () => {
    setDrawer("messages");
    setLoadingPanel("messages");
    try {
      const data = await readApi<{ threads: MessageThread[] }>("/api/messages", role);
      setMessages(data.data.threads);
    } catch {
      notify("error", "Gagal memuat pesan.");
    } finally {
      setLoadingPanel(null);
    }
  };

  const openPhone = () => {
    setDrawer("phone");
  };

  const sendMessage = async (body: string) => {
    try {
      const response = await apiFetch("/api/messages", role, {
        method: "POST",
        body: JSON.stringify({
          body,
          orderId: lastOrder?.id ?? selectedOrder?.id,
          recipientRole: role === "CUSTOMER" ? "PARTNER" : "CUSTOMER"
        })
      });
      if (!response.ok) throw new Error("message failed");
      notify("success", "Pesan terkirim.");
      await openMessages();
    } catch {
      notify("error", "Gagal mengirim pesan.");
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
    setSelectedCategory(category && category !== "Lainnya" ? category : null);
    goTo("partnerList");
  };

  const openWalletHistory = async () => {
    setScreen("walletHistory");
    try {
      const data = await readApi<{ transactions: WalletTransaction[] }>("/api/wallet/transactions", "CUSTOMER");
      setWalletTransactions(data.data.transactions);
    } catch {
      notify("error", "Gagal memuat riwayat dompet.");
    }
  };

  const loadSettings = async () => {
    try {
      const data = await readApi<{ settings: AdminSettings }>(appRole === "admin" ? "/api/admin/settings" : "/api/settings", appRole === "admin" ? "ADMIN" : "CUSTOMER");
      setAdminSettings(data.data.settings);
      setOrderDraft((draft) => ({
        ...draft,
        platformFee: data.data.settings.platformFee,
        promoCode: draft.promoCode || data.data.settings.promoCode
      }));
      return data.data.settings;
    } catch {
      notify("error", "Gagal memuat pengaturan aplikasi.");
      return null;
    }
  };

  const loadCustomerServices = async (silent = true) => {
    try {
      const response = await fetch("/api/services/categories", { cache: "no-store" });
      if (!response.ok) throw new Error("services failed");
      const payload = (await response.json()) as {
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
      if (!silent) notify("error", "Gagal memuat menu jasa customer.");
    }
  };

  const loadCustomerPartners = async (silent = true) => {
    try {
      const response = await fetch("/api/partners", { cache: "no-store" });
      if (!response.ok) throw new Error("partners failed");
      const payload = (await response.json()) as {
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
          tone: serviceToneByIndex(index),
          Icon: serviceIconByName(partner.category)
        }))
      );
    } catch {
      if (!silent) notify("error", "Gagal memuat mitra customer.");
    }
  };

  const loadCustomerOrders = async (silent = false) => {
    if (!silent) setLoadingPanel("orders");
    try {
      const data = await readApi<{ orders: any[] }>("/api/orders", "CUSTOMER");
      setCustomerOrders(data.data.orders);
    } catch {
      notify("error", "Gagal memuat pesanan.");
    } finally {
      if (!silent) setLoadingPanel(null);
    }
  };

  const loadPartnerOrders = async (silent = false) => {
    if (!silent) setLoadingPanel("partnerOrders");
    try {
      const data = await readApi<{ orders: any[] }>("/api/partner/orders", "PARTNER");
      setPartnerOrders(data.data.orders);
    } catch {
      notify("error", "Gagal memuat pesanan mitra.");
    } finally {
      if (!silent) setLoadingPanel(null);
    }
  };

  const loadAdminData = async (silent = false) => {
    if (!silent) setLoadingPanel("admin");
    try {
      const dashboard = await readApi<{ revenueMonth: number; totalOrders: number; activePartners: number; activeCustomers: number }>("/api/admin/dashboard", "ADMIN");
      const liveOrders = await readApi<{ orders: any[] }>("/api/admin/orders/live", "ADMIN");
      const mapData = await readApi<AdminMapData>("/api/admin/maps", "ADMIN");
      const consoleData = await readApi<AdminConsoleData>("/api/admin/console", "ADMIN");
      const pending = await readApi<{ partners: any[] }>("/api/admin/partners/pending-verification", "ADMIN");
      const settings = await readApi<{ settings: AdminSettings }>("/api/admin/settings", "ADMIN");
      setAdminDashboard(dashboard.data);
      setAdminLiveOrders(liveOrders.data.orders);
      setAdminMapData(mapData.data);
      setAdminConsole(consoleData.data);
      setPendingPartners(pending.data.partners);
      setAdminSettings(settings.data.settings);
    } catch {
      notify("error", "Gagal memuat dashboard admin.");
    } finally {
      if (!silent) setLoadingPanel(null);
    }
  };

  const updatePartnerOnline = async (online: boolean) => {
    setPartnerOnline(online);
    try {
      const response = await apiFetch("/api/partner/status", "PARTNER", {
        method: "PUT",
        body: JSON.stringify({ status: online ? "ONLINE" : "OFFLINE" })
      });
      if (!response.ok) throw new Error("status failed");
      notify("success", online ? "Status mitra online." : "Status mitra offline.");
    } catch {
      setPartnerOnline(!online);
      notify("error", "Gagal mengubah status mitra.");
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
      if (!response.ok) throw new Error("status failed");
      notify("success", `Status pesanan ${orderId} diperbarui.`);
      await loadPartnerOrders();
    } catch {
      notify("error", "Gagal memperbarui status pesanan.");
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
      if (!response.ok) throw new Error("settings failed");
      const payload = (await response.json()) as { data: { settings: AdminSettings } };
      setAdminSettings(payload.data.settings);
      notify("success", "Pengaturan admin tersimpan dan tersambung ke semua aplikasi.");
    } catch {
      notify("error", "Gagal menyimpan pengaturan admin.");
    }
  };

  const saveAdminConsole = async (settings: AdminConsoleData["settings"]) => {
    try {
      const response = await apiFetch("/api/admin/console", "ADMIN", {
        method: "PUT",
        body: JSON.stringify(settings)
      });
      if (!response.ok) throw new Error("console failed");
      const payload = (await response.json()) as { data: { settings: AdminConsoleData["settings"] } };
      setAdminConsole((current) => ({ ...current, settings: payload.data.settings }));
      notify("success", "Pusat kontrol admin tersimpan.");
    } catch {
      notify("error", "Gagal menyimpan pusat kontrol admin.");
    }
  };

  const acceptOrder = async (orderId: string) => {
    try {
      const response = await apiFetch(`/api/orders/${orderId}/accept`, "PARTNER", { method: "POST" });
      if (!response.ok) throw new Error("accept failed");
      notify("success", `Pesanan ${orderId} diterima.`);
      await loadPartnerOrders();
      return true;
    } catch {
      notify("error", "Gagal menerima pesanan.");
      return false;
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
    const matched = customerPartners.filter((partner) => partner.category.toLowerCase() === selectedCategory.toLowerCase());
    return matched.length ? matched : customerPartners;
  }, [customerPartners, selectedCategory]);

  useEffect(() => {
    void loadSettings();
    if (screen === "home" || screen === "search") void loadCustomerServices();
    if (screen === "home" || screen === "search" || screen === "partnerList") void loadCustomerPartners();
    if (screen === "orders") void loadCustomerOrders();
    if (screen === "partner") void loadPartnerOrders();
    if (screen === "admin") void loadAdminData();
  }, [screen]);

  useEffect(() => {
    if (appRole === "customer") {
      void loadSettings();
      void loadCustomerServices();
      void loadCustomerPartners();
      const timer = window.setInterval(() => {
        void loadSettings();
        void loadCustomerServices();
        void loadCustomerPartners();
        if (screen === "orders" || screen === "tracking") void loadCustomerOrders(true);
      }, 6000);
      return () => window.clearInterval(timer);
    }

    if (appRole === "partner") {
      void loadPartnerOrders();
      const timer = window.setInterval(() => {
        void loadPartnerOrders(true);
      }, 5000);
      return () => window.clearInterval(timer);
    }

    if (appRole === "admin") {
      void loadAdminData();
      const timer = window.setInterval(() => {
        void loadAdminData(true);
      }, 8000);
      return () => window.clearInterval(timer);
    }
  }, [appRole, screen]);

  const selectPartner = (partner: Partner) => {
    setCurrentPartner(partner);
    setOrderDraft((draft) => ({
      ...draft,
      partnerId: partner.id,
      serviceCategoryId: `SC-${partner.category.toUpperCase().replaceAll(" ", "-")}`,
      serviceFee: partner.category === "Cuci Sepatu" ? 45000 : partner.category === "Servis Kipas" ? 65000 : 30000,
      scheduleNote: `Estimasi tiba ${partner.eta}`,
      discount: draft.promoStatus === "valid" ? adminSettings.promoDiscount : 0
    }));
    goTo("detail");
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
      const payload = (await response.json()) as { data: { promo: { code: string; discount: number } } };
      updateDraft({ promoCode: payload.data.promo.code, promoStatus: "valid", discount: payload.data.promo.discount });
      notify("success", `Promo ${payload.data.promo.code} berhasil diterapkan.`);
    } catch {
      updateDraft({ promoCode: promo, promoStatus: "invalid", discount: 0 });
      notify("error", `Kode promo tidak valid. Kode aktif Admin saat ini: ${adminSettings.promoCode}.`);
    }
  };

  const submitOrder = async () => {
    const total = orderTotal(orderDraft);

    if (!orderDraft.partnerId) {
      notify("error", "Belum ada mitra tersedia untuk jasa ini. Silakan tunggu partner terverifikasi.");
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

    if (orderDraft.paymentMethod === "SERJAFAN Pay" && currentUser.walletBalance < total) {
      notify("error", "Saldo SERJAFAN Pay belum cukup untuk pesanan ini.");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        partnerId: orderDraft.partnerId,
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
            : orderDraft.paymentMethod === "Kartu Kredit"
              ? "CARD"
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
      const payload = (await response.json()) as { data: { order: { id: string; total: number; status: string } } };
      const createdOrder: LastOrder = {
        id: payload.data.order.id,
        partner: currentPartner,
        total: payload.data.order.total,
        status: "pending"
      };
      setLastOrder(createdOrder);
      setSelectedOrder({
        id: createdOrder.id,
        partnerId: currentPartner.id,
        partner: currentPartner,
        status: "PENDING",
        total: createdOrder.total,
        addressTitle: orderDraft.address,
        addressSubtitle: orderDraft.addressNote,
        fulfillmentMode: orderDraft.fulfillmentMode
      });
      notify("success", `Pesanan ${createdOrder.id} dikirim. Tunggu konfirmasi mitra.`);
      await loadCustomerOrders(true);
      goTo("orders");
    } catch {
      notify("error", "Jaringan bermasalah, coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-cloud text-slate-950">
      <div className="sticky top-0 z-50 mx-auto flex max-w-[420px] items-center justify-between bg-navy px-5 py-2 text-[11px] font-semibold text-white">
        <span>9:41</span>
        <span className="text-sm font-extrabold tracking-[1px]">{appTitleByRole[appRole]}</span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-3 rounded-[2px] border border-white" />
          <span className="h-3 w-1.5 rounded-sm bg-white" />
        </span>
      </div>

      {showRoleTabs && (
        <Tabs value={activeRoleTab} onValueChange={(value) => goTo(value as Screen)}>
          <TabsList className="sticky top-[30px] z-40 mx-auto max-w-[420px] overflow-x-auto border-b border-slate-200 bg-white px-5 py-4 no-scrollbar">
            {roleTabs.map((item) => (
              <TabsTrigger key={item.value} value={item.value} className="shrink-0">
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <div className="mx-auto max-w-[420px] pb-28">
        {screen === "home" && (
          <CustomerHome
            user={currentUser}
            services={customerServices}
            partners={customerPartners}
            onSelectPartner={selectPartner}
            onOpenPartnerList={openPartnerList}
            onOpenNotifications={() => void openNotifications()}
            onOpenMessages={() => void openMessages()}
            onOpenOrders={() => void openOrderCenter()}
            onOpenSearch={openSearch}
            onOpenTopup={() => goTo("topup")}
            onOpenTransfer={() => goTo("transfer")}
            onOpenWalletHistory={() => void openWalletHistory()}
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
            title={selectedCategory ? `Mitra ${selectedCategory}` : "Daftar Mitra"}
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
            user={currentUser}
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
            onOpenTracking={(order) => {
              setSelectedOrder(order);
              setLastOrder(order?.id ? { id: order.id, partner: getPartnerByOrder(order, currentPartner), total: order.total ?? 0, status: "on_the_way" } : null);
              goTo("tracking");
            }}
            onOrderNow={() => goTo("home")}
          />
        )}
        {screen === "tracking" && (
          <LiveTracking
            order={lastOrder}
            sourceOrder={selectedOrder}
            fallbackPartner={currentPartner}
            onNavigate={goTo}
            onOpenMessages={() => void openMessages()}
            onOpenPhone={openPhone}
          />
        )}
        {screen === "profile" && (
          <ProfileScreen
            user={currentUser}
            onOpenOrders={() => void openOrderCenter()}
            onOpenNotifications={() => void openNotifications()}
            onOpenWallet={() => goTo("wallet")}
            onOpenTopup={() => goTo("topup")}
            onOpenTransfer={() => goTo("transfer")}
            onOpenWalletHistory={() => void openWalletHistory()}
            onEditProfile={() => goTo("editProfile")}
          />
        )}
        {screen === "wallet" && <WalletScreen user={currentUser} onBack={() => goTo("profile")} onOpenTopup={() => goTo("topup")} onOpenHistory={() => void openWalletHistory()} />}
        {screen === "topup" && <TopUpScreen onBack={() => goTo("wallet")} onSubmit={() => notify("success", "Top Up berhasil diproses.")} />}
        {screen === "transfer" && <TransferScreen onBack={() => goTo("profile")} onSubmit={() => notify("success", "Transfer diproses melalui Dompet SERJAFAN.")} />}
        {screen === "walletHistory" && <WalletHistoryScreen transactions={walletTransactions} onBack={() => goTo("profile")} />}
        {screen === "editProfile" && <EditProfileScreen user={currentUser} onBack={() => goTo("profile")} onSubmit={() => notify("success", "Profil berhasil diperbarui.")} />}
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
            onOpenMessages={() => void openMessages()}
            onOpenPhone={openPhone}
            onOpenAccount={() => goTo("partnerAccount")}
          />
        )}
        {screen === "partnerAccount" && (
          <PartnerAccountScreen orders={partnerOrders} onBack={() => goTo("partner")} onOpenMessages={() => void openMessages()} onOpenPhone={openPhone} />
        )}
        {screen === "admin" && (
          <AdminDashboard
            dashboard={adminDashboard}
            liveOrders={adminLiveOrders}
            mapData={adminMapData}
            consoleData={adminConsole}
            pendingPartners={pendingPartners}
            settings={adminSettings}
            loading={loadingPanel === "admin"}
            onReviewPartner={reviewPartner}
            onSaveSettings={(settings) => void saveAdminSettings(settings)}
            onSaveConsole={(settings) => void saveAdminConsole(settings)}
            onOpenMessages={() => void openMessages()}
          />
        )}
      </div>

      {toast && <Toast kind={toast.kind} message={toast.message} />}
      {drawer === "notifications" && (
        <NotificationsDrawer
          loading={loadingPanel === "notifications"}
          items={notifications}
          onClose={() => setDrawer(null)}
          onOpenOrders={() => {
            setDrawer(null);
            void openOrderCenter();
          }}
        />
      )}
      {drawer === "messages" && (
        <MessagesDrawer loading={loadingPanel === "messages"} items={messages} onClose={() => setDrawer(null)} onSend={(text) => void sendMessage(text)} />
      )}
      {drawer === "phone" && <PhoneDrawer role={role} partner={currentPartner} onClose={() => setDrawer(null)} />}
      {showBottomNav && <BottomNav active={screen} onNavigate={goTo} onOpenSearch={openSearch} onOpenProfile={openProfile} />}
    </main>
  );
}

function CustomerHome({
  user,
  services,
  partners,
  onSelectPartner,
  onOpenPartnerList,
  onOpenNotifications,
  onOpenMessages,
  onOpenOrders,
  onOpenSearch,
  onOpenTopup,
  onOpenTransfer,
  onOpenWalletHistory
}: {
  user: CurrentUser;
  services: ServiceItem[];
  partners: Partner[];
  onSelectPartner: (partner: Partner) => void;
  onOpenPartnerList: (category?: string) => void;
  onOpenNotifications: () => void;
  onOpenMessages: () => void;
  onOpenOrders: () => void;
  onOpenSearch: () => void;
  onOpenTopup: () => void;
  onOpenTransfer: () => void;
  onOpenWalletHistory: () => void;
}) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="relative overflow-hidden rounded-b-[32px] bg-gradient-to-br from-navy to-[#1a3a6e] px-5 pb-10 pt-5 text-white">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-flame/15" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-[15px] font-extrabold">Halo, {user.name}</h1>
            <p className="mt-1 flex items-center gap-1 text-xs text-white/65">
              <MapPin className="h-3.5 w-3.5" /> {user.location}
            </p>
          </div>
          <Button size="icon" variant="ghost" className="relative rounded-xl bg-white/10 text-white hover:bg-white/20" onClick={onOpenNotifications}>
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-flame ring-2 ring-navy" />
          </Button>
        </div>

        <div className="relative mt-4 overflow-hidden rounded-[20px] bg-gradient-to-br from-flame to-[#ff9a3c] p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-white/80">Saldo SERJAFAN Pay</p>
          <p className="mt-1 text-3xl font-extrabold">Rp {formatRupiah(user.walletBalance)}</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Button size="sm" className="rounded-[10px] border border-white/30 bg-white/20 text-white hover:bg-white/30" onClick={onOpenTopup}>
              <Wallet className="h-4 w-4" /> Top Up
            </Button>
            <Button size="sm" className="rounded-[10px] border border-white/30 bg-white/20 text-white hover:bg-white/30" onClick={onOpenTransfer}>
              <CreditCard className="h-4 w-4" /> Transfer
            </Button>
            <Button size="sm" className="rounded-[10px] border border-white/30 bg-white/20 text-white hover:bg-white/30" onClick={onOpenWalletHistory}>
              <ListOrdered className="h-4 w-4" /> Riwayat
            </Button>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4">
        <button type="button" onClick={onOpenSearch} className="flex items-center gap-3 rounded-[14px] border border-slate-100 bg-white px-4 py-3 text-left shadow-soft">
          <Search className="h-5 w-5 text-flame" />
          <span className="text-sm text-slate-500">Cari layanan, mitra, atau promo...</span>
        </button>
      </div>

      <Section title="Promo Hari Ini" action="Lihat semua promo">
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {[
            ["HEMAT50", "Diskon 50% Cuci Sepatu", "Berlaku hingga malam ini", "from-navy to-[#1a3a6e]"],
            ["GRATISONGKIR", "Ongkir gratis untuk area Padang", "Minimum order Rp 30rb", "from-flame to-[#ff9a3c]"],
            ["MITRA BARU", "Bonus untuk layanan pertama", "Klaim di order berikutnya", "from-teal-700 to-teal-500"]
          ].map(([badge, title, desc, tone]) => (
            <button key={badge} type="button" onClick={() => onOpenPartnerList(badge === "HEMAT50" ? "Cuci Sepatu" : undefined)} className={cn("h-[110px] min-w-[220px] rounded-[18px] bg-gradient-to-br p-4 text-left text-white", tone)}>
              <Badge className="bg-white/20 text-[10px] text-white">{badge}</Badge>
              <h3 className="mt-2 text-[13px] font-extrabold leading-snug">{title}</h3>
              <p className="mt-1 text-[11px] text-white/70">{desc}</p>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Layanan Populer">
        <div className="grid grid-cols-4 gap-2.5">
          {services.map(({ name, icon: Icon, tone }, index) => (
            <button
              key={name}
              type="button"
              onClick={() => onOpenPartnerList(name)}
              className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-[16px] border border-slate-100 bg-white px-2 py-3 shadow-[0_4px_16px_rgba(11,31,58,0.06)] transition hover:-translate-y-0.5"
            >
              <span className={cn("flex h-11 w-11 items-center justify-center rounded-[14px]", tone)}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-center text-[10px] font-bold leading-tight">{name}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Pesan & Bantuan" action="Buka inbox">
        <div className="grid gap-2">
          <button
            type="button"
            onClick={onOpenMessages}
            className="flex items-center justify-between rounded-[16px] bg-white p-4 text-left shadow-soft"
          >
            <div>
              <p className="text-sm font-extrabold">Pesan masuk</p>
              <p className="text-xs text-slate-500">Lihat chat dengan mitra dan support.</p>
            </div>
            <MessageCircle className="h-5 w-5 text-flame" />
          </button>
        </div>
      </Section>

      <Section title="Mitra Terdekat" action="Lihat peta mitra">
        {partners.length ? (
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {partners.map(({ Icon, name, category, distance, rating, reviews, status, tone, id }) => (
            <button
              key={id}
                type="button"
                onClick={() => onSelectPartner(partners.find((partner) => partner.id === id) ?? partners[0])}
              className="min-w-[170px] overflow-hidden rounded-[20px] border border-slate-100 bg-white text-left shadow-soft transition hover:-translate-y-0.5"
            >
              <div className={cn("flex h-[85px] items-center justify-center", tone)}>
                <Icon className="h-9 w-9" />
              </div>
              <div className="p-3">
                <h3 className="text-[13px] font-extrabold">{name}</h3>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {category} - {distance}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] font-bold">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {rating} ({reviews})
                  </span>
                  <Badge variant={status === "Online" ? "success" : "warning"} className="text-[9px]">
                    {status}
                  </Badge>
                </div>
              </div>
            </button>
            ))}
          </div>
        ) : (
          <div className="rounded-[16px] bg-white p-4 text-sm text-slate-500 shadow-soft">
            Belum ada mitra terverifikasi di Kota Padang. Mitra akan muncul setelah pendaftaran partner disetujui admin.
          </div>
        )}
      </Section>
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
    <section className="animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="relative flex h-[220px] items-center justify-center rounded-b-[32px] bg-gradient-to-br from-navy to-[#1a3a6e] text-white">
        <Icon className="h-16 w-16" />
        <Button size="icon" variant="ghost" className="absolute left-5 top-5 rounded-xl bg-white/15 text-white" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button size="icon" variant="ghost" className="absolute right-5 top-5 rounded-xl bg-white/15 text-white">
          <Heart className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-5">
        <h1 className="text-xl font-extrabold">
          {partner.name} - {partner.category}
        </h1>
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="blue" className="gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> Terverifikasi SERJAFAN
          </Badge>
          <span className="text-xs text-slate-500">Sejak 2019</span>
        </div>

        <div className="my-4 grid grid-cols-3 gap-2.5">
          {[
            [partner.rating, "Rating"],
            [partner.orders, "Pesanan"],
            [partner.eta, "ETA Kedatangan"]
          ].map(([value, label]) => (
            <div key={label} className="rounded-[14px] bg-cloud p-3 text-center">
              <p className="text-base font-extrabold">{value}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[16px] bg-cloud p-4">
          <h2 className="text-[13px] font-extrabold">Tentang Layanan</h2>
          <p className="mt-2 text-xs leading-6 text-slate-500">
            Layanan {partner.category.toLowerCase()} profesional dari mitra terverifikasi. Estimasi kedatangan,
            biaya, dan status mitra dibaca dari state yang sama untuk detail, checkout, dan tracking.
          </p>
        </div>

        <div className="my-4 flex items-center justify-between rounded-[18px] bg-gradient-to-br from-flame to-[#ff9a3c] p-5 text-white">
          <div>
            <p className="text-xs font-semibold text-white/80">Estimasi Harga</p>
            <p className="text-[11px] text-white/70">Tergantung detail pekerjaan</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-white/80">Mulai dari</p>
            <p className="text-[22px] font-extrabold">Rp {formatRupiah(partner.priceFrom)}</p>
          </div>
        </div>

        <h2 className="mb-2 text-[13px] font-extrabold">Ulasan Pelanggan</h2>
        <div className="rounded-[14px] bg-cloud p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-flame to-[#ff9a3c] text-[13px] font-bold text-white">
              AR
            </span>
            <span className="text-xs font-bold">Andi R.</span>
            <span className="ml-auto flex text-amber-500">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-3 w-3 fill-current" />
              ))}
            </span>
          </div>
          <p className="text-xs text-slate-500">Cepat banget, hasilnya rapi, harga wajar. Recommended!</p>
        </div>

        <div className="mt-4 flex gap-2.5">
          <Button variant="outline" size="lg" className="flex-1 border-2 border-navy text-navy" onClick={onOpenMessages}>
            <MessageCircle className="h-4 w-4" /> Chat
          </Button>
          <Button variant="outline" size="lg" className="flex-1 border-2 border-navy text-navy" onClick={onOpenMessages}>
            <Inbox className="h-4 w-4" /> Pesan
          </Button>
          <Button variant="navy" size="lg" className="flex-[2]" onClick={onOrder}>
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
          placeholder="Cari kategori atau mitra"
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

      <Section title={query ? "Mitra ditemukan" : "Mitra trending"}>
        <div className="space-y-2">
          {partners.map((partner) => (
            <PartnerListItem key={partner.id} partner={partner} onSelect={() => onSelectPartner(partner)} />
          ))}
        </div>
      </Section>
    </section>
  );
}

function PartnerListScreen({
  title,
  partners,
  onSelectPartner,
  onBack
}: {
  title: string;
  partners: Partner[];
  onSelectPartner: (partner: Partner) => void;
  onBack: () => void;
}) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 p-5 duration-300">
      <div className="mb-4 flex items-center gap-3">
        <Button size="icon" variant="secondary" className="rounded-[10px]" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-extrabold">{title}</h1>
          <p className="text-xs text-slate-500">Pilih mitra sesuai kategori layanan.</p>
        </div>
      </div>
      <div className="space-y-3">
        {partners.length ? (
          partners.map((partner) => <PartnerListItem key={partner.id} partner={partner} onSelect={() => onSelectPartner(partner)} />)
        ) : (
          <div className="rounded-[16px] bg-white p-4 text-sm text-slate-500 shadow-soft">
            Belum ada mitra untuk kategori ini. Partner baru akan tampil setelah registrasi dan verifikasi admin.
          </div>
        )}
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
  const payments: { name: PayMethod; Icon: React.ElementType }[] = [
    { name: "SERJAFAN Pay", Icon: Wallet },
    { name: "Kartu Kredit", Icon: CreditCard },
    { name: "Tunai", Icon: Wallet }
  ];

  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 p-5 duration-300">
      <div className="mb-5 flex items-center gap-3">
        <Button size="icon" variant="secondary" className="rounded-[10px]" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-extrabold">Konfirmasi Pesanan</h1>
          <p className="text-xs text-slate-500">{partner.name}</p>
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
            title: "Jasa ke Saya",
            note: "Panggilan ke lokasi customer"
          },
          {
            value: "CUSTOMER_TO_PARTNER" as FulfillmentMode,
            title: "Saya ke Jasa",
            note: "Jemput atau antar barang"
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
        label="Catatan untuk Mitra"
        icon={MessageCircle}
        title={draft.note || "Tambahkan catatan"}
        note={draft.noteMeta}
        onClick={() => setEditor("note")}
      />

      <Label>Metode Pembayaran</Label>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {payments.map(({ name, Icon }) => (
          <button
            key={name}
            type="button"
            onClick={() => onUpdateDraft({ paymentMethod: name })}
            className={cn(
              "min-h-[78px] rounded-[14px] border-2 bg-white p-3 text-center shadow-[0_2px_10px_rgba(11,31,58,0.06)] transition",
              draft.paymentMethod === name ? "border-flame bg-orange-50 text-flame" : "border-transparent text-slate-500"
            )}
          >
            <Icon className="mx-auto mb-1 h-5 w-5" />
            <span className="text-[10px] font-bold leading-tight">{name}</span>
          </button>
        ))}
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
      </div>

      <Button variant="orange" size="lg" className="w-full" disabled={isSubmitting} onClick={onSubmit}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {isSubmitting ? "Memproses..." : `Konfirmasi & Bayar Rp ${formatRupiah(total)}`}
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
            {editor === "address" ? "Pilih Alamat" : editor === "schedule" ? "Pilih Jadwal" : "Catatan Mitra"}
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
  onNavigate,
  onOpenMessages,
  onOpenPhone
}: {
  order: LastOrder | null;
  sourceOrder?: any;
  fallbackPartner: Partner;
  onNavigate: (screen: Screen) => void;
  onOpenMessages: () => void;
  onOpenPhone: () => void;
}) {
  const partner = order?.partner ?? fallbackPartner;
  const initialMode = (sourceOrder?.fulfillmentMode as FulfillmentMode | undefined) ?? "PARTNER_TO_CUSTOMER";
  const [trackingMode, setTrackingMode] = useState<FulfillmentMode>(initialMode);
  const route = routeForOrder(sourceOrder ?? { partnerId: partner.id, status: order?.status }, partner, trackingMode);
  const isPartnerComing = trackingMode === "PARTNER_TO_CUSTOMER";

  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="relative min-h-[560px]">
        <div className="relative overflow-hidden rounded-b-[24px] bg-white">
          <ConnectedGoogleMap title={isPartnerComing ? "Map jasa menuju customer" : "Map customer menuju partner"} route={route} height={320} />
          <Button size="icon" variant="secondary" className="absolute left-4 top-4 rounded-xl bg-white shadow-soft" onClick={() => onNavigate("home")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        <div className="absolute inset-x-0 bottom-0 rounded-t-[24px] bg-white p-5 shadow-[0_-8px_32px_rgba(11,31,58,0.12)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500">{order?.id ?? "Pesanan aktif"}</p>
              <h1 className="mt-0.5 text-[15px] font-extrabold">{isPartnerComing ? "Jasa menuju lokasi customer" : "Arah ke lokasi partner/jasa"}</h1>
            </div>
            <Badge variant="orange">{partner.eta}</Badge>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-[16px] bg-cloud p-1.5">
            <button
              type="button"
              onClick={() => setTrackingMode("PARTNER_TO_CUSTOMER")}
              className={cn(
                "rounded-[12px] px-3 py-2 text-[11px] font-extrabold transition",
                isPartnerComing ? "bg-white text-flame shadow-[0_2px_10px_rgba(11,31,58,0.08)]" : "text-slate-500"
              )}
            >
              Jasa ke Customer
            </button>
            <button
              type="button"
              onClick={() => setTrackingMode("CUSTOMER_TO_PARTNER")}
              className={cn(
                "rounded-[12px] px-3 py-2 text-[11px] font-extrabold transition",
                !isPartnerComing ? "bg-white text-flame shadow-[0_2px_10px_rgba(11,31,58,0.08)]" : "text-slate-500"
              )}
            >
              Customer ke Jasa
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-navy to-[#1a3a6e] text-sm font-extrabold text-white">
              MT
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-extrabold">{partner.name}</h2>
              <p className="truncate text-xs text-slate-500">
                {partner.rating} - {partner.category} - B 1234 ABC
              </p>
            </div>
            <Button size="icon" variant="navy" className="rounded-[14px]" onClick={onOpenPhone}>
              <Phone className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="orange" className="rounded-[14px]" onClick={onOpenMessages}>
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 rounded-[14px] bg-orange-50 p-3 text-xs font-semibold leading-5 text-orange-800">
            {isPartnerComing
              ? `${partner.name} diarahkan dari titik partner menuju alamat customer untuk panggilan atau antar barang.`
              : `Customer diarahkan dari alamat customer menuju ${partner.name} untuk jemput barang atau antar barang ke lokasi jasa.`}
          </div>
          <div className="mt-5 grid grid-cols-4">
            {[
              ["Dikonfirmasi", "done"],
              ["Mitra Siap", "done"],
              ["Perjalanan", "active"],
              ["Selesai", "pending"]
            ].map(([label, status], index) => (
              <div key={label} className="relative text-center">
                {index < 3 && (
                  <span className={cn("absolute left-1/2 right-[-50%] top-3.5 h-0.5", status === "pending" ? "bg-slate-300" : "bg-flame")} />
                )}
                <span
                  className={cn(
                    "relative z-10 mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                    status === "pending" ? "bg-slate-300 text-slate-500" : "bg-flame text-white",
                    status === "active" && "ring-4 ring-orange-100"
                  )}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
                <p className={cn("text-[9px] font-bold", status === "pending" ? "text-slate-500" : "text-flame")}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ConnectedGoogleMap({
  title,
  route,
  height = 220,
  compact = false
}: {
  title: string;
  route: ConnectedRoute;
  height?: number;
  compact?: boolean;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const origin = `${route.origin.lat},${route.origin.lng}`;
  const destination = `${route.destination.lat},${route.destination.lng}`;
  const externalUrl = googleMapsDirectionsUrl(route);
  const originCaption = route.origin.role === "partner" ? "Titik Partner/Jasa" : "Titik Customer";
  const destinationCaption = route.destination.role === "partner" ? "Titik Partner/Jasa" : "Titik Customer";
  const OriginIcon = route.origin.role === "partner" ? Bike : MapPin;
  const DestinationIcon = route.destination.role === "partner" ? Bike : MapPin;
  const embedUrl = apiKey
    ? `https://www.google.com/maps/embed/v1/directions?key=${encodeURIComponent(apiKey)}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=driving`
    : null;

  return (
    <div className="overflow-hidden rounded-[18px] border border-slate-100 bg-white shadow-soft">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase text-slate-500">{title}</p>
          <h3 className="truncate text-sm font-extrabold">{route.origin.label} ke {route.destination.label}</h3>
        </div>
        <Badge variant={route.status === "PENDING" ? "warning" : "blue"}>{route.eta ?? route.status ?? "Live"}</Badge>
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
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 p-4" style={{ minHeight: height }}>
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(#cbd5e1_1px,transparent_1px),linear-gradient(90deg,#cbd5e1_1px,transparent_1px)] [background-size:34px_34px]" />
          <div className="relative z-10 grid gap-3">
            <div className="flex items-start gap-3 rounded-[14px] bg-white/90 p-3 shadow-[0_2px_12px_rgba(11,31,58,0.08)]">
              <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-white">
                <OriginIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-500">{originCaption}</p>
                <p className="text-sm font-extrabold">{route.origin.label}</p>
                <p className="truncate text-xs text-slate-500">{route.origin.address}</p>
              </div>
            </div>
            <div className="ml-[17px] h-8 w-0.5 rounded-full bg-flame" />
            <div className="flex items-start gap-3 rounded-[14px] bg-white/90 p-3 shadow-[0_2px_12px_rgba(11,31,58,0.08)]">
              <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-flame text-white">
                <DestinationIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-500">{destinationCaption}</p>
                <p className="text-sm font-extrabold">{route.destination.label}</p>
                <p className="truncate text-xs text-slate-500">{route.destination.address}</p>
              </div>
            </div>
            {!compact && (
              <p className="rounded-[12px] bg-white/85 p-3 text-xs font-semibold leading-5 text-slate-600">
                Rute ini memakai data order yang sama dengan aplikasi customer, partner, dan admin. Tombol Google Maps membuka navigasi asli sesuai koordinat pesanan.
              </p>
            )}
            <a
              href={externalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-navy px-4 py-3 text-sm font-extrabold text-white"
            >
              <Navigation className="h-4 w-4" /> Buka Google Maps
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function OrdersCenter({
  orders,
  loading,
  onOpenTracking,
  onOrderNow
}: {
  orders: any[];
  loading: boolean;
  onOpenTracking: (order: any) => void;
  onOrderNow: () => void;
}) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 p-5 duration-300">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold">Pesanan</h1>
          <p className="text-xs text-slate-500">Pesanan aktif dan riwayat Anda.</p>
        </div>
        <Button variant="orange" size="sm" onClick={onOrderNow}>
          <ShoppingCart className="h-4 w-4" /> Pesan Baru
        </Button>
      </div>

      {loading ? (
        <div className="rounded-[18px] bg-white p-4 shadow-soft">
          <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-20 animate-pulse rounded bg-slate-100" />
        </div>
      ) : orders.length ? (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-[18px] bg-white p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold text-slate-500">{order.id}</p>
                  <h2 className="text-sm font-extrabold">{order.addressTitle}</h2>
                  <p className="text-xs text-slate-500">{order.scheduleTitle}</p>
                </div>
                <Badge variant={order.status === "PENDING" ? "warning" : "orange"}>{order.status}</Badge>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{order.partner?.name ?? "Mitra"}</span>
                <span>Rp {formatRupiah(order.total ?? 0)}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" className="flex-1 border-2 border-navy text-navy" disabled={order.status === "PENDING"} onClick={() => onOpenTracking(order)}>
                  <MapPin className="h-4 w-4" /> Tracking
                </Button>
              </div>
              {order.status === "PENDING" && <p className="mt-2 text-xs font-bold text-amber-700">Menunggu konfirmasi pemilik jasa.</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[18px] bg-white p-5 text-center shadow-soft">
          <p className="text-sm font-bold">Belum ada pesanan</p>
          <p className="mt-1 text-xs text-slate-500">Silakan buat pesanan baru dari layanan atau mitra.</p>
          <Button variant="navy" className="mt-4" onClick={onOrderNow}>
            Pesan Sekarang
          </Button>
        </div>
      )}
    </section>
  );
}

function ProfileScreen({
  user,
  onOpenOrders,
  onOpenNotifications,
  onOpenWallet,
  onOpenTopup,
  onOpenTransfer,
  onOpenWalletHistory,
  onEditProfile
}: {
  user: CurrentUser;
  onOpenOrders: () => void;
  onOpenNotifications: () => void;
  onOpenWallet: () => void;
  onOpenTopup: () => void;
  onOpenTransfer: () => void;
  onOpenWalletHistory: () => void;
  onEditProfile: () => void;
}) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 p-5 duration-300">
      <h1 className="text-xl font-extrabold">Profil</h1>
      <div className="mt-4 rounded-[16px] bg-white p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-navy text-sm font-extrabold text-white">RH</span>
          <div>
            <h2 className="text-base font-extrabold">{user.name}</h2>
            <p className="text-xs text-slate-500">+62 812-0000-2026 - {user.location}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        <ProfileAction icon={Wallet} label="Dompet SERJAFAN" onClick={onOpenWallet} />
        <ProfileAction icon={Wallet} label="Top Up" onClick={onOpenTopup} />
        <ProfileAction icon={CreditCard} label="Transfer" onClick={onOpenTransfer} />
        <ProfileAction icon={ListOrdered} label="Riwayat transaksi" onClick={onOpenWalletHistory} />
        <ProfileAction icon={ShoppingBag} label="Pesanan saya" onClick={onOpenOrders} />
        <ProfileAction icon={Bell} label="Notifikasi" onClick={onOpenNotifications} />
        <ProfileAction icon={UserCircle} label="Edit profil" onClick={onEditProfile} />
      </div>
    </section>
  );
}

function ProfileAction({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center justify-between rounded-[14px] bg-white p-4 text-left shadow-soft">
      <span className="flex items-center gap-3 text-sm font-extrabold">
        <Icon className="h-5 w-5 text-flame" /> {label}
      </span>
      <ChevronRight className="h-4 w-4 text-slate-300" />
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
      <div className="rounded-[18px] bg-gradient-to-br from-flame to-[#ff9a3c] p-5 text-white">
        <p className="text-xs font-bold text-white/75">Saldo SERJAFAN Pay</p>
        <p className="mt-1 text-3xl font-extrabold">Rp {formatRupiah(user.walletBalance)}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="navy" onClick={onOpenHistory}>
          <ListOrdered className="h-4 w-4" /> Riwayat
        </Button>
        <Button variant="orange" onClick={onOpenTopup}>
          <Wallet className="h-4 w-4" /> Top Up
        </Button>
      </div>
    </section>
  );
}

function TopUpScreen({ onBack, onSubmit }: { onBack: () => void; onSubmit: () => void }) {
  const [amount, setAmount] = useState("100000");
  const [method, setMethod] = useState("Virtual Account");

  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 p-5 duration-300">
      <div className="mb-4 flex items-center gap-3">
        <Button size="icon" variant="secondary" className="rounded-[10px]" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-extrabold">Top Up</h1>
      </div>
      <div className="space-y-3 rounded-[16px] bg-white p-4 shadow-soft">
        <Input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Nominal top up" inputMode="numeric" />
        <div className="grid grid-cols-2 gap-2">
          {["Virtual Account", "Kartu Kredit"].map((item) => (
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
        <Button
          variant="orange"
          className="w-full"
          disabled={!amount.trim()}
          onClick={() => {
            onSubmit();
            onBack();
          }}
        >
          Top Up Rp {formatRupiah(Number(amount || 0))}
        </Button>
      </div>
    </section>
  );
}

function TransferScreen({ onBack, onSubmit }: { onBack: () => void; onSubmit: () => void }) {
  const [target, setTarget] = useState("");
  const [amount, setAmount] = useState("");
  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 p-5 duration-300">
      <div className="mb-4 flex items-center gap-3">
        <Button size="icon" variant="secondary" className="rounded-[10px]" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-extrabold">Transfer</h1>
      </div>
      <div className="space-y-3 rounded-[16px] bg-white p-4 shadow-soft">
        <Input value={target} onChange={(event) => setTarget(event.target.value)} placeholder="Nomor HP atau rekening tujuan" />
        <Input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Nominal transfer" inputMode="numeric" />
        <Button
          variant="orange"
          className="w-full"
          disabled={!target.trim() || !amount.trim()}
          onClick={() => {
            onSubmit();
            onBack();
          }}
        >
          Transfer Sekarang
        </Button>
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
  onSubmit: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState("+62 812-0000-2026");
  const [city, setCity] = useState(user.location);

  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 p-5 duration-300">
      <div className="mb-4 flex items-center gap-3">
        <Button size="icon" variant="secondary" className="rounded-[10px]" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-extrabold">Edit Profil</h1>
      </div>
      <div className="space-y-3 rounded-[16px] bg-white p-4 shadow-soft">
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama lengkap" />
        <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Nomor HP" />
        <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Kota" />
        <Button
          variant="orange"
          className="w-full"
          disabled={!name.trim() || !phone.trim() || !city.trim()}
          onClick={() => {
            onSubmit();
            onBack();
          }}
        >
          Simpan Profil
        </Button>
      </div>
    </section>
  );
}

function WalletHistoryScreen({ transactions, onBack }: { transactions: WalletTransaction[]; onBack: () => void }) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 p-5 duration-300">
      <div className="mb-4 flex items-center gap-3">
        <Button size="icon" variant="secondary" className="rounded-[10px]" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-extrabold">Riwayat Transaksi</h1>
      </div>
      <div className="space-y-2">
        {transactions.length ? (
          transactions.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-[14px] bg-white p-4 shadow-soft">
              <div>
                <p className="text-sm font-extrabold">{item.description}</p>
                <p className="text-xs text-slate-500">{item.type}</p>
              </div>
              <span className={cn("text-sm font-extrabold", item.amount < 0 ? "text-red-600" : "text-emerald-600")}>
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
  onOpenMessages,
  onOpenPhone,
  onOpenAccount
}: {
  onNavigate: (screen: Screen) => void;
  online: boolean;
  setOnline: (online: boolean) => void;
  orderDraft: OrderDraft;
  orders: any[];
  loading: boolean;
  onAcceptOrder: (id: string) => Promise<boolean>;
  onRejectOrder: (id: string) => Promise<boolean>;
  onUpdateOrderStatus: (id: string, status: "ON_THE_WAY" | "IN_PROGRESS" | "COMPLETED") => Promise<void>;
  onOpenMessages: () => void;
  onOpenPhone: () => void;
  onOpenAccount: () => void;
}) {
  const incomingOrders = orders.filter((order) => order.status === "PENDING" || order.status === "CONFIRMED");
  const activeOrders = orders.filter((order) => order.status !== "PENDING" && order.status !== "CONFIRMED" && order.status !== "CANCELLED" && order.status !== "DONE");

  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="rounded-b-[28px] bg-gradient-to-br from-navy to-[#1a3a6e] px-5 pb-8 pt-5 text-white">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-white/70">PARTNER DASHBOARD</p>
            <h1 className="mt-1 text-lg font-extrabold">Akun Partner</h1>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/15 text-sm font-extrabold">PT</span>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={online} onCheckedChange={setOnline} />
          <span className="text-[13px] font-bold">{online ? "Online - Siap Menerima Pesanan" : "Offline - Tidak Menerima Pesanan"}</span>
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" size="sm" className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={onOpenMessages}>
            <MessageCircle className="h-4 w-4" /> Pesan
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
            ["Saldo Dompet", "Rp 520.000"]
          ].map(([label, value]) => (
            <div key={label} className="rounded-[16px] border border-white/10 bg-white/10 p-3.5">
              <p className="text-[11px] text-white/70">{label}</p>
              <p className="mt-1 text-lg font-extrabold">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <Section title="Pesanan Masuk" action={`${incomingOrders.length} Baru`}>
        {loading ? (
          <div className="rounded-[20px] bg-white p-4 shadow-soft">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-24 animate-pulse rounded bg-slate-100" />
          </div>
        ) : incomingOrders.length ? (
          incomingOrders.map((order) => (
            <div key={order.id} className="rounded-[20px] border-l-4 border-flame bg-white p-4 shadow-soft">
              <div className="mb-1.5 flex items-start justify-between gap-3">
                <span className="flex items-center gap-2 text-[13px] font-extrabold">
                  <KeyRound className="h-4 w-4 text-flame" /> {order.serviceCategoryId}
                </span>
                <span className="text-[13px] font-extrabold text-flame">Rp {formatRupiah(order.total ?? orderDraft.serviceFee)}</span>
              </div>
              <p className="mb-3 text-xs text-slate-500">{order.addressTitle}, {order.addressSubtitle}</p>
              <div className="mb-3">
                <ConnectedGoogleMap title="Rute Pesanan Masuk" route={routeForOrder(order, getPartnerByOrder(order))} height={150} compact />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-2 border-red-600 text-red-600" onClick={() => onRejectOrder(order.id)}>
                  <X className="h-4 w-4" /> Tolak
                </Button>
                <Button variant="orange" className="flex-[2]" onClick={() => {
                  void (async () => {
                    const accepted = await onAcceptOrder(order.id);
                    if (accepted) onNavigate("tracking");
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
            <div key={order.id} className="mb-3 rounded-[16px] bg-white p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold text-slate-500">{order.customerId}</p>
                  <h3 className="text-sm font-extrabold">{order.addressTitle}</h3>
                  <p className="text-xs text-slate-500">{order.note ?? "Tanpa catatan"}</p>
                </div>
                <Badge variant="blue">{order.status}</Badge>
              </div>
              <div className="mt-3">
                <ConnectedGoogleMap title="Rute Aktif Partner" route={routeForOrder(order, getPartnerByOrder(order))} height={150} compact />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Button variant="outline" className="border-2 border-navy text-navy" onClick={() => void onUpdateOrderStatus(order.id, "ON_THE_WAY")}>
                  Berangkat
                </Button>
                <Button variant="outline" className="border-2 border-navy text-navy" onClick={() => void onUpdateOrderStatus(order.id, "IN_PROGRESS")}>
                  Mulai Kerja
                </Button>
                <Button variant="orange" onClick={() => void onUpdateOrderStatus(order.id, "COMPLETED")}>
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
              {["Top Partner", "Respon Cepat", "100% Hadir", "Premium"].map((badge) => (
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
  onBack,
  onOpenMessages,
  onOpenPhone
}: {
  orders: any[];
  onBack: () => void;
  onOpenMessages: () => void;
  onOpenPhone: () => void;
}) {
  const doneOrders = orders.filter((order) => order.status === "DONE").length;
  const activeOrders = orders.filter((order) => !["PENDING", "CANCELLED", "DONE"].includes(order.status)).length;

  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 p-5 duration-300">
      <div className="mb-4 flex items-center gap-3">
        <Button size="icon" variant="secondary" className="rounded-[10px]" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-extrabold">Akun Partner</h1>
          <p className="text-xs text-slate-500">Data pemilik jasa dan aktivitas layanan.</p>
        </div>
      </div>

      <div className="rounded-[18px] bg-navy p-5 text-white shadow-soft">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-white/15 text-sm font-extrabold">PT</span>
          <div>
            <h2 className="text-lg font-extrabold">Partner SERJAFAN</h2>
            <p className="text-xs text-white/65">Profil partner akan tampil setelah registrasi disetujui admin.</p>
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
          ["Saldo Partner", "Rp 0"]
        ].map(([label, value]) => (
          <div key={label} className="rounded-[14px] bg-white p-4 shadow-soft">
            <p className="text-[11px] font-bold text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-extrabold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2">
        <Button variant="outline" className="justify-start border-2 border-navy text-navy" onClick={onOpenMessages}>
          <MessageCircle className="h-4 w-4" /> Menu Pesan Customer
        </Button>
        <Button variant="outline" className="justify-start border-2 border-navy text-navy" onClick={onOpenPhone}>
          <Phone className="h-4 w-4" /> Menu Telepon Customer
        </Button>
        <Button variant="orange" onClick={onBack}>
          Kembali ke Dashboard Partner
        </Button>
      </div>
    </section>
  );
}

function AdminDashboard({
  dashboard,
  liveOrders,
  mapData,
  consoleData,
  pendingPartners,
  settings,
  loading,
  onReviewPartner,
  onSaveSettings,
  onSaveConsole,
  onOpenMessages
}: {
  dashboard: { revenueMonth: number; totalOrders: number; activePartners: number; activeCustomers: number } | null;
  liveOrders: any[];
  mapData: AdminMapData;
  consoleData: AdminConsoleData;
  pendingPartners: any[];
  settings: AdminSettings;
  loading: boolean;
  onReviewPartner: (partnerId: string, action: "approve" | "reject") => Promise<void>;
  onSaveSettings: (settings: AdminSettings) => void;
  onSaveConsole: (settings: AdminConsoleData["settings"]) => void;
  onOpenMessages: () => void;
}) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="flex items-center justify-between bg-navy px-5 py-4 text-white">
        <div>
          <p className="text-[11px] font-bold text-white/60">SERJAFAN ADMIN</p>
          <h1 className="text-base font-extrabold">Dashboard Utama</h1>
        </div>
        <Badge className="rounded-md bg-flame text-white">Super Admin</Badge>
      </div>

      <div className="px-5 pt-4">
        <Button variant="outline" className="border-2 border-navy text-navy" onClick={onOpenMessages}>
          <MessageCircle className="h-4 w-4" /> Pesan
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 p-5">
        {[
          ["Revenue Bulan Ini", `Rp ${formatRupiah(dashboard?.revenueMonth ?? 128000000)}`, "+24.5% vs bulan lalu"],
          ["Total Pesanan", `${dashboard?.totalOrders ?? 4827}`, "+18.3% growth"],
          ["Mitra Aktif", `${dashboard?.activePartners ?? 312}`, "45 baru minggu ini"],
          ["Pelanggan Aktif", `${dashboard?.activeCustomers ?? 8241}`, "+31.2% MoM"]
        ].map(([label, value, trend]) => (
          <Card key={label} className="rounded-[16px] border-slate-100 shadow-[0_2px_12px_rgba(11,31,58,0.06)]">
            <CardContent className="p-3.5">
              <p className="text-[11px] font-semibold text-slate-500">{label}</p>
              <p className="mt-1 text-[22px] font-extrabold">{value}</p>
              <p className="mt-0.5 text-[10px] font-bold text-emerald-600">{trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <AdminEditCenter settings={settings} onSave={onSaveSettings} />
      <AdminControlCenter consoleData={consoleData} onSave={onSaveConsole} />

      <AdminMapsCenter mapData={mapData} />

      <div className="px-5 pb-4">
        <h2 className="mb-2 text-sm font-extrabold">Pesanan Live</h2>
        <div className="overflow-hidden rounded-[16px] bg-white shadow-soft">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-2 bg-cloud px-4 py-2.5 text-[10px] font-extrabold uppercase text-slate-500">
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
              <div key={order.id} className="grid grid-cols-[1.5fr_1fr_1fr_1fr] items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-[11px]">
                <span className="text-xs font-bold">{order.customerId}</span>
                <span className="text-slate-500">{order.serviceCategoryId}</span>
                <span className="font-bold">Rp {formatRupiah(order.total ?? 0)}</span>
                <Badge variant="blue" className="justify-center px-1 text-[10px]">
                  {order.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="px-5 pb-6">
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
                      <p className="truncate text-[11px] text-slate-500">{partner.category} - KTP sudah upload</p>
                    </div>
                    <Badge variant="warning" className="rounded-md text-[10px]">Menunggu</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 border-2 border-red-600 text-red-600" onClick={() => void onReviewPartner(partner.id, "reject")}>
                      Tolak
                    </Button>
                    <Button variant="navy" className="flex-[2]" onClick={() => void onReviewPartner(partner.id, "approve")}>
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
  onSave: (settings: AdminSettings) => void;
}) {
  const [draft, setDraft] = useState<AdminSettings>(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const update = (patch: Partial<AdminSettings>) => setDraft((current) => ({ ...current, ...patch }));

  return (
    <div className="px-5 pb-4">
      <h2 className="mb-2 text-sm font-extrabold">Pusat Edit Admin</h2>
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
          <div className="grid grid-cols-2 gap-2">
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
          <Button variant="orange" onClick={() => onSave(draft)}>
            <Check className="h-4 w-4" /> Simpan Perubahan Sistem
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdminMapsCenter({ mapData }: { mapData: AdminMapData }) {
  const primaryPair = mapData.pairs[0];

  if (!primaryPair) {
    return (
      <div className="px-5 pb-4">
        <h2 className="mb-2 text-sm font-extrabold">Maps Pantau Customer & Partner</h2>
        <div className="rounded-[16px] bg-white p-4 text-sm text-slate-500 shadow-soft">
          Belum ada customer dan partner yang sedang terhubung order aktif.
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
    <div className="px-5 pb-4">
      <h2 className="mb-2 text-sm font-extrabold">Maps Pantau Customer & Partner</h2>
      <div className="grid gap-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Order Dipantau", mapData.summary.monitoredOrders],
            ["Customer", mapData.summary.monitoredCustomers],
            ["Partner", mapData.summary.monitoredPartners]
          ].map(([label, value]) => (
            <div key={label} className="rounded-[14px] bg-white p-3 text-center shadow-soft">
              <p className="text-[10px] font-bold text-slate-500">{label}</p>
              <p className="mt-1 text-lg font-extrabold text-navy">{value}</p>
            </div>
          ))}
        </div>

        <ConnectedGoogleMap title="Google Maps Pantauan Admin" route={primaryRoute} height={230} />

        <div className="rounded-[16px] bg-white p-3 shadow-soft">
          <p className="mb-2 text-[11px] font-bold uppercase text-slate-500">Posisi customer dan partner</p>
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
                        <span className="block font-extrabold text-blue-800">Partner: {pair.partner.label}</span>
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
  onSave
}: {
  consoleData: AdminConsoleData;
  onSave: (settings: AdminConsoleData["settings"]) => void;
}) {
  const [tab, setTab] = useState<"customer" | "partner" | "services" | "promo" | "registration">("services");
  const [draft, setDraft] = useState<AdminConsoleData["settings"]>(consoleData.settings);
  const [newService, setNewService] = useState({ name: "", fee: "25000", description: "" });

  useEffect(() => {
    setDraft(consoleData.settings);
  }, [consoleData.settings]);

  const updateService = (index: number, patch: Partial<AdminConsoleData["settings"]["services"][number]>) => {
    setDraft((current) => ({
      ...current,
      services: current.services.map((service, serviceIndex) => (serviceIndex === index ? { ...service, ...patch } : service))
    }));
  };

  const updatePromo = (index: number, patch: Partial<AdminConsoleData["settings"]["promos"][number]>) => {
    setDraft((current) => ({
      ...current,
      promos: current.promos.map((promo, promoIndex) => (promoIndex === index ? { ...promo, ...patch, code: (patch.code ?? promo.code).toUpperCase() } : promo))
    }));
  };

  const updateRequirement = (index: number, patch: Partial<AdminConsoleData["settings"]["partnerRequirements"][number]>) => {
    setDraft((current) => ({
      ...current,
      partnerRequirements: current.partnerRequirements.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    }));
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

    setDraft((current) => {
      const next = {
        ...current,
        services: [...current.services, service]
      };
      onSave(next);
      return next;
    });
    setNewService({ name: "", fee: "25000", description: "" });
  };

  const addBlankService = () => {
    setDraft((current) => ({
      ...current,
      services: [
        ...current.services,
        { id: `svc_${Date.now()}`, name: "Jasa Baru", fee: 25000, active: true, description: "Deskripsi jasa baru dari admin." }
      ]
    }));
  };

  const addPromo = () => {
    setDraft((current) => ({
      ...current,
      promos: [...current.promos, { code: "PROMO", discount: 10000, active: true, note: "Promo baru dari admin." }]
    }));
  };

  return (
    <div className="px-5 pb-4">
      <h2 className="mb-2 text-sm font-extrabold">Pusat Kontrol Admin</h2>
      <div className="rounded-[18px] bg-white p-3 shadow-soft">
        <div className="grid grid-cols-5 gap-1 rounded-[14px] bg-cloud p-1">
          {[
            ["customer", "Customer"],
            ["partner", "Partner"],
            ["services", "Jasa"],
            ["promo", "Promo"],
            ["registration", "Daftar"]
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value as typeof tab)}
              className={cn("rounded-[10px] px-2 py-2 text-[10px] font-extrabold", tab === value ? "bg-white text-flame shadow-[0_2px_10px_rgba(11,31,58,0.08)]" : "text-slate-500")}
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
              onChange={(patch) => setDraft((current) => ({ ...current, customerFeatureCopy: { ...current.customerFeatureCopy, ...patch } }))}
            />
            <EntityList title="Customer Terdaftar" items={consoleData.customers.map((customer) => `${customer.name} - ${customer.email}`)} empty="Belum ada customer." />
          </div>
        )}

        {tab === "partner" && (
          <div className="mt-3 grid gap-3">
            <AdminTextEditor
              title="Tampilan Fitur Partner"
              headline={draft.partnerFeatureCopy.headline}
              description={draft.partnerFeatureCopy.description}
              onChange={(patch) => setDraft((current) => ({ ...current, partnerFeatureCopy: { ...current.partnerFeatureCopy, ...patch } }))}
            />
            <EntityList
              title="Partner Terdaftar"
              items={consoleData.partners.map((partner) => `${partner.name} - ${partner.category} - ${partner.verificationStatus}`)}
              empty="Belum ada partner."
            />
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
              <div key={`${promo.code}-${index}`} className="rounded-[14px] border border-slate-100 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-extrabold">Promo</p>
                  <Switch checked={promo.active} onCheckedChange={(active) => updatePromo(index, { active })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={promo.code} onChange={(event) => updatePromo(index, { code: event.target.value })} />
                  <Input value={String(promo.discount)} inputMode="numeric" onChange={(event) => updatePromo(index, { discount: Number(event.target.value || 0) })} />
                </div>
                <Input className="mt-2" value={promo.note} onChange={(event) => updatePromo(index, { note: event.target.value })} />
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
            {draft.partnerRequirements.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 rounded-[14px] border border-slate-100 p-3">
                <Input value={item.label} onChange={(event) => updateRequirement(index, { label: event.target.value })} />
                <Switch checked={item.required} onCheckedChange={(required) => updateRequirement(index, { required })} />
              </div>
            ))}
          </div>
        )}

        <Button variant="orange" className="mt-4 w-full" onClick={() => onSave(draft)}>
          <Check className="h-4 w-4" /> Simpan Pusat Kontrol Admin
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

function EntityList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-[14px] border border-slate-100 p-3">
      <p className="mb-2 text-xs font-extrabold">{title}</p>
      <div className="grid gap-2">
        {items.length ? (
          items.slice(0, 6).map((item) => (
            <div key={item} className="rounded-[12px] bg-cloud px-3 py-2 text-[11px] font-bold text-slate-600">
              {item}
            </div>
          ))
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
    <section className="px-5 pt-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold">{title}</h2>
        {action && <span className="text-xs font-bold text-flame">{action}</span>}
      </div>
      {children}
    </section>
  );
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
  onOpenOrders
}: {
  loading: boolean;
  items: NotificationItem[];
  onClose: () => void;
  onOpenOrders: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] bg-navy/30 backdrop-blur-[2px]">
      <div className="absolute right-0 top-0 h-full w-full max-w-[420px] bg-white shadow-2xl">
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
          <Button variant="outline" className="mb-4 border-2 border-navy text-navy" onClick={onOpenOrders}>
            <ListOrdered className="h-4 w-4" /> Buka Pesanan
          </Button>
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

  return (
    <div className="fixed inset-0 z-[90] bg-navy/30 backdrop-blur-[2px]">
      <div className="absolute right-0 top-0 h-full w-full max-w-[420px] bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-navy px-5 py-4 text-white">
          <div>
            <p className="text-[11px] font-bold text-white/65">INBOX</p>
            <h2 className="text-base font-extrabold">Pesan</h2>
          </div>
          <Button size="icon" variant="ghost" className="rounded-xl bg-white/10 text-white hover:bg-white/20" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex h-[calc(100%-72px)] flex-col p-4">
          <div className="mb-3 flex gap-2">
            <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Tulis pesan..." />
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
          {loading ? (
            <div className="space-y-3 overflow-y-auto">
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
                    {item.unread && <Badge variant="warning">Baru</Badge>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[16px] bg-cloud p-4 text-sm text-slate-500">Belum ada pesan masuk.</div>
          )}
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
  const target = role === "CUSTOMER" ? partner.name : "Customer aktif";
  const phone = role === "CUSTOMER" ? "+62 812-7788-2026" : "+62 812-0000-2026";

  return (
    <div className="fixed inset-0 z-[90] bg-navy/30 backdrop-blur-[2px]">
      <div className="absolute right-0 top-0 h-full w-full max-w-[420px] bg-white shadow-2xl">
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
          <div className="rounded-[18px] bg-cloud p-4">
            <p className="text-xs font-bold text-slate-500">Nomor kontak</p>
            <p className="mt-1 text-2xl font-extrabold">{phone}</p>
            <p className="mt-1 text-xs text-slate-500">Panggilan tercatat sebagai komunikasi order SERJAFAN.</p>
          </div>
          <div className="mt-4 grid gap-2">
            <a href={`tel:${phone.replaceAll(" ", "")}`} className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-navy px-8 text-sm font-bold text-white">
              <Phone className="h-4 w-4" /> Hubungi Sekarang
            </a>
            <Button variant="outline" className="border-2 border-navy text-navy" onClick={onClose}>
              Tutup
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
      <div className="absolute right-0 top-0 h-full w-full max-w-[420px] bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-navy px-5 py-4 text-white">
          <div>
            <p className="text-[11px] font-bold text-white/65">PENCARIAN</p>
            <h2 className="text-base font-extrabold">Cari layanan atau mitra</h2>
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
            <h3 className="mb-2 text-sm font-extrabold">Mitra</h3>
            <div className="grid gap-2">
              {partners.map((partner) => (
                <button
                  key={partner.id}
                  type="button"
                  onClick={() => onSelectPartner(partner)}
                  className="flex items-center justify-between rounded-[14px] bg-cloud p-3 text-left"
                >
                  <div>
                    <p className="text-sm font-bold">{partner.name}</p>
                    <p className="text-xs text-slate-500">
                      {partner.category} - {partner.distance}
                    </p>
                  </div>
                  <Badge variant={partner.status === "Online" ? "success" : "warning"}>{partner.status}</Badge>
                </button>
              ))}
              {!partners.length && <p className="text-xs text-slate-500">Tidak ada mitra yang cocok.</p>}
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
      <div className="absolute right-0 top-0 h-full w-full max-w-[420px] bg-white shadow-2xl">
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
  onNavigate,
  onOpenSearch,
  onOpenProfile
}: {
  active: Screen;
  onNavigate: (screen: Screen) => void;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
}) {
  const items = [
    { label: "Beranda", Icon: Home, screen: "home" as Screen },
    { label: "Cari", Icon: Search, action: onOpenSearch },
    { label: "Pesanan", Icon: ShoppingBag, screen: "orders" as Screen },
    { label: "Profil", Icon: UserCircle, action: onOpenProfile }
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-[420px] -translate-x-1/2 items-center justify-around border-t border-slate-100 bg-white px-2 pb-5 pt-2.5 shadow-[0_-4px_20px_rgba(11,31,58,0.08)]">
      {items.slice(0, 2).map(({ label, Icon, screen, action }) => (
        <button key={label} type="button" onClick={() => (action ? action() : onNavigate(screen as Screen))} className={cn("flex min-w-14 flex-col items-center gap-1 px-2 text-[9px] font-bold", active === screen ? "text-flame" : "text-slate-500")}>
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </button>
      ))}
      <button type="button" onClick={() => onNavigate("partnerList")} className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-flame text-white shadow-[0_6px_20px_rgba(255,122,0,0.4)]">
        <Bolt className="h-6 w-6" />
      </button>
      {items.slice(2).map(({ label, Icon, screen, action }) => (
        <button key={label} type="button" onClick={() => (action ? action() : onNavigate(screen as Screen))} className={cn("flex min-w-14 flex-col items-center gap-1 px-2 text-[9px] font-bold", active === screen ? "text-flame" : "text-slate-500")}>
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
