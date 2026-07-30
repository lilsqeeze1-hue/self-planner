"use client";

import {
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ExternalLink,
  Gift,
  Home,
  ListChecks,
  MapPin,
  MoreHorizontal,
  Plane,
  Plus,
  ReceiptText,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type NavKey = "home" | "tasks" | "plans" | "finance" | "more";
type ItemKind = "task" | "trip" | "place" | "wish" | "expense" | "budget";

type Item = {
  id: string;
  spaceId?: string;
  kind: ItemKind;
  title: string;
  description: string;
  category: string;
  status: string;
  amount: number | null;
  currency: string;
  paidBy: string | null;
  assignedTo: string | null;
  dueDate: string | null;
  startDate: string | null;
  endDate: string | null;
  link: string | null;
  metadata: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
};

type ComposerState = {
  open: boolean;
  kind: Exclude<ItemKind, "budget">;
};

function telegramHeaders(json = false): HeadersInit {
  const initData = (
    window as typeof window & {
      Telegram?: { WebApp?: { initData?: string } };
    }
  ).Telegram?.WebApp?.initData;
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(initData ? { "x-telegram-init-data": initData } : {}),
  };
}

const navItems: Array<{
  key: NavKey;
  label: string;
  icon: typeof Home;
}> = [
  { key: "home", label: "Главная", icon: Home },
  { key: "tasks", label: "Задачи", icon: ListChecks },
  { key: "plans", label: "Планы", icon: Plane },
  { key: "finance", label: "Финансы", icon: WalletCards },
  { key: "more", label: "Ещё", icon: MoreHorizontal },
];

const sectionCopy: Record<
  NavKey,
  { eyebrow: string; title: string; actionKind: ComposerState["kind"] }
> = {
  home: {
    eyebrow: "Четверг, 30 июля",
    title: "Добрый день",
    actionKind: "task",
  },
  tasks: {
    eyebrow: "Общие и личные",
    title: "Задачи",
    actionKind: "task",
  },
  plans: {
    eyebrow: "Поездки и места",
    title: "Наши планы",
    actionKind: "trip",
  },
  finance: {
    eyebrow: "Июль 2026",
    title: "Финансы",
    actionKind: "expense",
  },
  more: {
    eyebrow: "Ссылки и идеи",
    title: "Хотелки",
    actionKind: "wish",
  },
};

// Kept only as a design reference during development; production state starts empty.
const _sampleItems: Item[] = [
  {
    id: "task-internet",
    kind: "task",
    title: "Оплатить интернет",
    description: "",
    category: "Дом",
    status: "active",
    amount: null,
    currency: "RUB",
    paidBy: null,
    assignedTo: "me",
    dueDate: "2026-07-30",
    startDate: null,
    endDate: null,
    link: null,
    metadata: "{}",
    createdBy: "me",
  },
  {
    id: "task-documents",
    kind: "task",
    title: "Собрать документы для поездки",
    description: "Паспорта, страховки и подтверждение бронирования",
    category: "Путешествия",
    status: "active",
    amount: null,
    currency: "RUB",
    paidBy: null,
    assignedTo: "both",
    dueDate: "2026-08-02",
    startDate: null,
    endDate: null,
    link: null,
    metadata: "{}",
    createdBy: "me",
  },
  {
    id: "task-food",
    kind: "task",
    title: "Заказать корм",
    description: "",
    category: "Дом",
    status: "done",
    amount: null,
    currency: "RUB",
    paidBy: null,
    assignedTo: "partner",
    dueDate: "2026-07-29",
    startDate: null,
    endDate: null,
    link: null,
    metadata: "{}",
    createdBy: "partner",
  },
  {
    id: "trip-istanbul",
    kind: "trip",
    title: "Стамбул",
    description: "The Galata Istanbul — MGallery",
    category: "Путешествия",
    status: "active",
    amount: null,
    currency: "RUB",
    paidBy: null,
    assignedTo: null,
    dueDate: null,
    startDate: "2026-09-10",
    endDate: "2026-09-15",
    link: null,
    metadata: JSON.stringify({
      flight: "10 сентября, 08:45",
      hotel: "The Galata",
      checklistDone: 8,
      checklistTotal: 12,
      emoji: "🇹🇷",
    }),
    createdBy: "both",
  },
  {
    id: "place-blanc",
    kind: "place",
    title: "Blanc",
    description: "Хохловский переулок, 7–9с2",
    category: "Кафе",
    status: "saved",
    amount: null,
    currency: "RUB",
    paidBy: null,
    assignedTo: null,
    dueDate: null,
    startDate: null,
    endDate: null,
    link: "https://yandex.ru/maps/",
    metadata: JSON.stringify({
      city: "Москва",
      rating: "4,8",
      note: "Зайти на завтрак",
    }),
    createdBy: "partner",
  },
  {
    id: "place-galata",
    kind: "place",
    title: "Galata Tower",
    description: "Bereketzade, Galata Kulesi",
    category: "Достопримечательности",
    status: "saved",
    amount: null,
    currency: "RUB",
    paidBy: null,
    assignedTo: null,
    dueDate: null,
    startDate: null,
    endDate: null,
    link: null,
    metadata: JSON.stringify({
      city: "Стамбул",
      rating: "4,7",
      note: "Лучше прийти к открытию",
    }),
    createdBy: "me",
  },
  {
    id: "wish-headphones",
    kind: "wish",
    title: "Наушники Sony WH-1000XM6",
    description: "Сравнить цену перед покупкой",
    category: "Техника",
    status: "saved",
    amount: 3999000,
    currency: "RUB",
    paidBy: null,
    assignedTo: null,
    dueDate: null,
    startDate: null,
    endDate: null,
    link: "https://market.yandex.ru/",
    metadata: "{}",
    createdBy: "me",
  },
  {
    id: "wish-coffee",
    kind: "wish",
    title: "Кофемолка Timemore",
    description: "",
    category: "Дом",
    status: "saved",
    amount: 1299000,
    currency: "RUB",
    paidBy: null,
    assignedTo: null,
    dueDate: null,
    startDate: null,
    endDate: null,
    link: "https://www.ozon.ru/",
    metadata: "{}",
    createdBy: "partner",
  },
  {
    id: "expense-maya",
    kind: "expense",
    title: "Ресторан Maya",
    description: "",
    category: "Кафе и рестораны",
    status: "shared",
    amount: 480000,
    currency: "RUB",
    paidBy: "me",
    assignedTo: null,
    dueDate: null,
    startDate: "2026-07-29",
    endDate: null,
    link: null,
    metadata: JSON.stringify({ splitMe: 50 }),
    createdBy: "me",
  },
  {
    id: "expense-home",
    kind: "expense",
    title: "Товары для дома",
    description: "",
    category: "Дом",
    status: "shared",
    amount: 234000,
    currency: "RUB",
    paidBy: "partner",
    assignedTo: null,
    dueDate: null,
    startDate: "2026-07-28",
    endDate: null,
    link: null,
    metadata: JSON.stringify({ splitMe: 50 }),
    createdBy: "partner",
  },
  {
    id: "expense-groceries",
    kind: "expense",
    title: "Продукты",
    description: "",
    category: "Продукты",
    status: "shared",
    amount: 785000,
    currency: "RUB",
    paidBy: "partner",
    assignedTo: null,
    dueDate: null,
    startDate: "2026-07-25",
    endDate: null,
    link: null,
    metadata: JSON.stringify({ splitMe: 50 }),
    createdBy: "partner",
  },
  {
    id: "expense-taxi",
    kind: "expense",
    title: "Такси",
    description: "",
    category: "Транспорт",
    status: "personal",
    amount: 126000,
    currency: "RUB",
    paidBy: "me",
    assignedTo: null,
    dueDate: null,
    startDate: "2026-07-23",
    endDate: null,
    link: null,
    metadata: JSON.stringify({ splitMe: 100 }),
    createdBy: "me",
  },
  {
    id: "budget-july",
    kind: "budget",
    title: "Бюджет на июль",
    description: "",
    category: "Общий бюджет",
    status: "active",
    amount: 12000000,
    currency: "RUB",
    paidBy: null,
    assignedTo: null,
    dueDate: null,
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    link: null,
    metadata: "{}",
    createdBy: "both",
  },
];

const taskCategories = ["Дом", "Работа", "Учёба", "Путешествия", "Личное"];
const placeCategories = [
  "Кафе",
  "Ресторан",
  "Бар",
  "Магазин",
  "Достопримечательности",
];
const expenseCategories = [
  "Продукты",
  "Кафе и рестораны",
  "Дом",
  "Транспорт",
  "Путешествия",
  "Покупки",
  "Другое",
];

function parseMeta(item: Item) {
  try {
    return JSON.parse(item.metadata || "{}") as Record<string, unknown>;
  } catch {
    return {} as Record<string, unknown>;
  }
}

function formatMoney(value: number | null, sign = false) {
  if (value == null) return "Цена не указана";
  const rubles = Math.round(value / 100);
  return `${sign && rubles > 0 ? "+" : ""}${new Intl.NumberFormat("ru-RU").format(rubles)} ₽`;
}

function formatShortDate(value: string | null) {
  if (!value) return "Без даты";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}

function getHost(link: string | null) {
  if (!link) return "Ссылка не добавлена";
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return "Магазин";
  }
}

function categoryTone(category: string) {
  if (["Дом", "Продукты"].includes(category)) return "blue";
  if (["Путешествия", "Транспорт"].includes(category)) return "green";
  if (["Кафе", "Ресторан", "Кафе и рестораны"].includes(category)) return "peach";
  if (["Работа", "Учёба"].includes(category)) return "lavender";
  return "sand";
}

function initials(name: string) {
  return name.trim().charAt(0).toUpperCase() || "Я";
}

export default function OrganizerApp() {
  const [active, setActive] = useState<NavKey>("home");
  const [items, setItems] = useState<Item[]>([]);
  const [viewerId] = useState<"me" | "partner">("me");
  const [viewerName, setViewerName] = useState("Босс");
  const [composer, setComposer] = useState<ComposerState>({
    open: false,
    kind: "task",
  });
  const [taskFilter, setTaskFilter] = useState("all");
  const [placeFilter, setPlaceFilter] = useState("Все");
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [toast, setToast] = useState("");

  const displayName = viewerId === "me" ? viewerName : "Партнёр";
  const today = "2026-07-30";
  const monthKey = "2026-07";

  useEffect(() => {
    const telegram = (
      window as typeof window & {
        Telegram?: {
          WebApp?: {
            ready(): void;
            expand(): void;
            initData?: string;
            initDataUnsafe?: {
              user?: { first_name?: string; id?: number };
            };
          };
        };
      }
    ).Telegram?.WebApp;

    telegram?.ready();
    telegram?.expand();
    const initData = telegram?.initData;
    if (!initData) {
      window.setTimeout(() => {
        setAccessError("Откройте Self‑Planner через кнопку в Telegram-боте.");
        setLoading(false);
      }, 0);
      return;
    }
    const telegramName = telegram?.initDataUnsafe?.user?.first_name;
    if (telegramName) {
      window.setTimeout(() => setViewerName(telegramName), 0);
    }

    const loadItems = async () => {
      try {
        const response = await fetch("/api/items?spaceId=shared", {
          headers: telegramHeaders(),
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          if (response.status === 401) {
            setAccessError(
              payload.error === "Access denied"
                ? "У вашего Telegram-аккаунта нет доступа к Self‑Planner."
                : "Не удалось подтвердить вход через Telegram. Закройте Mini App и откройте его снова.",
            );
            return;
          }
          setAccessError(
            "Хранилище данных ещё не подключено. Добавьте DATABASE_URL в настройках Vercel.",
          );
          return;
        }
        const payload = (await response.json()) as { items?: Item[] };
        setItems(payload.items || []);
      } catch {
        setAccessError(
          "Не удалось подключиться к Self‑Planner. Проверьте интернет и попробуйте снова.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadItems();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const tasks = useMemo(
    () => items.filter((item) => item.kind === "task"),
    [items],
  );
  const trips = useMemo(
    () => items.filter((item) => item.kind === "trip"),
    [items],
  );
  const places = useMemo(
    () => items.filter((item) => item.kind === "place"),
    [items],
  );
  const wishes = useMemo(
    () => items.filter((item) => item.kind === "wish"),
    [items],
  );
  const expenses = useMemo(
    () =>
      items
        .filter(
          (item) =>
            item.kind === "expense" && item.startDate?.startsWith(monthKey),
        )
        .sort((a, b) => (b.startDate || "").localeCompare(a.startDate || "")),
    [items],
  );

  const monthSpent = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const budget =
    items.find(
      (item) =>
        item.kind === "budget" && item.startDate?.startsWith(monthKey),
    )?.amount || 12000000;
  const budgetPercent = Math.min(
    100,
    Math.round((monthSpent / Math.max(1, budget)) * 100),
  );

  const balance = expenses.reduce((net, item) => {
    if (item.status !== "shared" || !item.amount) return net;
    const splitMe = Number(parseMeta(item).splitMe ?? 50);
    if (item.paidBy === "me") {
      return net + item.amount * (1 - splitMe / 100);
    }
    return net - item.amount * (splitMe / 100);
  }, 0);

  const nextTrip = trips[0];
  const openToday = tasks.filter(
    (item) => item.status !== "done" && item.dueDate === today,
  );

  const openComposer = (kind: ComposerState["kind"]) =>
    setComposer({ open: true, kind });

  const syncUpdate = async (id: string, patch: Partial<Item>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: telegramHeaders(true),
        body: JSON.stringify({ action: "update", id, ...patch }),
      });
      if (!response.ok) throw new Error("Update failed");
      const payload = (await response.json()) as { item?: Item };
      if (payload.item) {
        setItems((current) =>
          current.map((item) => (item.id === id ? payload.item! : item)),
        );
      }
    } catch {
      setOffline(true);
    }
  };

  const removeItem = async (id: string) => {
    const removed = items.find((item) => item.id === id);
    setItems((current) => current.filter((item) => item.id !== id));
    setToast("Запись удалена");
    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: telegramHeaders(true),
        body: JSON.stringify({ action: "delete", id }),
      });
      if (!response.ok) throw new Error("Delete failed");
    } catch {
      if (removed) setItems((current) => [...current, removed]);
      setOffline(true);
      setToast("Не удалось удалить запись");
    }
  };

  const createItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const kind = composer.kind;
    const tempId = `temp-${Date.now()}`;
    const amountRub = Number(form.get("amount") || 0);
    const common: Item = {
      id: tempId,
      kind,
      title: String(form.get("title") || "").trim(),
      description: String(form.get("description") || "").trim(),
      category: String(form.get("category") || "Другое"),
      status:
        kind === "place" || kind === "wish"
          ? "saved"
          : kind === "expense"
            ? String(form.get("sharing") || "shared")
            : "active",
      amount:
        kind === "expense" || kind === "wish"
          ? Math.round(amountRub * 100)
          : null,
      currency: "RUB",
      paidBy:
        kind === "expense" ? String(form.get("paidBy") || viewerId) : null,
      assignedTo:
        kind === "task" ? String(form.get("assignedTo") || viewerId) : null,
      dueDate:
        kind === "task" ? String(form.get("dueDate") || "") || null : null,
      startDate:
        kind === "trip" || kind === "expense"
          ? String(form.get("startDate") || "") || null
          : null,
      endDate:
        kind === "trip" ? String(form.get("endDate") || "") || null : null,
      link:
        kind === "place" || kind === "wish"
          ? String(form.get("link") || "").trim() || null
          : null,
      metadata:
        kind === "trip"
          ? JSON.stringify({
              hotel: String(form.get("hotel") || ""),
              checklistDone: 0,
              checklistTotal: 0,
            })
          : kind === "place"
            ? JSON.stringify({
                city: String(form.get("city") || ""),
                note: String(form.get("description") || ""),
              })
            : kind === "expense"
              ? JSON.stringify({
                  splitMe:
                    String(form.get("sharing")) === "personal"
                      ? viewerId === "me"
                        ? 100
                        : 0
                      : 50,
                })
              : "{}",
      createdBy: viewerId,
      createdAt: new Date().toISOString(),
    };

    if (!common.title) return;

    setItems((current) => [common, ...current]);
    setComposer((current) => ({ ...current, open: false }));
    setToast("Добавлено");

    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: telegramHeaders(true),
        body: JSON.stringify(common),
      });
      if (!response.ok) throw new Error("Create failed");
      const payload = (await response.json()) as { item?: Item };
      if (payload.item) {
        setItems((current) =>
          current.map((item) => (item.id === tempId ? payload.item! : item)),
        );
      }
    } catch {
      setOffline(true);
      setToast("Сохранено в демо-режиме");
    }
  };

  const renderTaskRow = (task: Item, compact = false) => {
    const done = task.status === "done";
    return (
      <div
        className={`task-row ${done ? "is-done" : ""} ${compact ? "is-compact" : ""}`}
        key={task.id}
      >
        <button
          className={`task-check task-check-${categoryTone(task.category)}`}
          aria-label={done ? "Вернуть задачу" : "Выполнить задачу"}
          onClick={() =>
            void syncUpdate(task.id, { status: done ? "active" : "done" })
          }
          type="button"
        >
          {done && <Check size={14} strokeWidth={3} />}
        </button>
        <button
          className="task-copy"
          onClick={() =>
            void syncUpdate(task.id, { status: done ? "active" : "done" })
          }
          type="button"
        >
          <strong>{task.title}</strong>
          <small>
            {task.category} · {formatShortDate(task.dueDate)}
            {task.assignedTo === "partner"
              ? " · Партнёр"
              : task.assignedTo === "both"
                ? " · Вместе"
                : ""}
          </small>
        </button>
        {!compact && (
          <button
            className="row-action"
            aria-label={`Удалить: ${task.title}`}
            onClick={() => void removeItem(task.id)}
            type="button"
          >
            <Trash2 size={15} />
          </button>
        )}
        {compact && <ChevronRight className="task-arrow" size={17} />}
      </div>
    );
  };

  const renderTripCard = (trip: Item, featured = false) => {
    const meta = parseMeta(trip);
    return (
      <article
        className={`panel trip-panel ${featured ? "trip-panel-featured" : ""}`}
      >
        <div className="trip-art">
          <div className="trip-art-sun" />
          <div className="trip-art-dome trip-art-dome-left" />
          <div className="trip-art-dome trip-art-dome-right" />
          <div className="trip-art-water" />
          <Plane className="trip-art-plane" size={24} />
          <span className="trip-flag">{String(meta.emoji || "✈️")}</span>
        </div>
        <div className="trip-content">
          <div className="trip-topline">
            <span className="status-dot">Всё по плану</span>
            <button className="icon-button" type="button" aria-label="Меню поездки">
              <MoreHorizontal size={20} />
            </button>
          </div>
          <h2>{trip.title}</h2>
          <p>
            {formatShortDate(trip.startDate)}–{formatShortDate(trip.endDate)} · 2
            человека
          </p>
          <div className="trip-detail-grid">
            <div>
              <CalendarDays size={17} />
              <span>
                <small>Вылет</small>
                {String(meta.flight || formatShortDate(trip.startDate))}
              </span>
            </div>
            <div>
              <MapPin size={17} />
              <span>
                <small>Отель</small>
                {String(meta.hotel || trip.description || "Добавить")}
              </span>
            </div>
          </div>
          <div className="trip-footer">
            <div>
              <strong>
                {Number(meta.checklistDone || 0)} из{" "}
                {Number(meta.checklistTotal || 0)}
              </strong>
              <span>пунктов готово</span>
            </div>
            <button className="round-button" type="button" aria-label="Открыть поездку">
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </article>
    );
  };

  const renderHome = () => (
    <div className="dashboard">
      <section className="summary-grid" aria-label="Краткая сводка">
        <article className="summary-card summary-card-tasks">
          <div className="summary-icon">
            <ListChecks size={19} />
          </div>
          <div className="summary-label">Сегодня</div>
          <div className="summary-value">
            {openToday.length} {openToday.length === 1 ? "задача" : "задачи"}
          </div>
          <div className="summary-note">
            {tasks.filter((task) => task.status === "done").length} уже выполнено
          </div>
        </article>
        <article className="summary-card summary-card-budget">
          <div className="summary-icon">
            <CircleDollarSign size={19} />
          </div>
          <div className="summary-label">Расходы в июле</div>
          <div className="summary-value">{formatMoney(monthSpent)}</div>
          <div className="progress-track">
            <span style={{ width: `${budgetPercent}%` }} />
          </div>
          <div className="summary-note">
            {budgetPercent}% от бюджета {formatMoney(budget)}
          </div>
        </article>
        <article className="summary-card summary-card-balance">
          <div className="summary-icon">
            <ReceiptText size={19} />
          </div>
          <div className="summary-label">Общий баланс</div>
          <div
            className={`summary-value ${balance >= 0 ? "summary-value-positive" : "summary-value-negative"}`}
          >
            {formatMoney(balance, true)}
          </div>
          <div className="summary-note">
            {balance >= 0 ? "Партнёр вернёт вам" : "Вы вернёте партнёру"}
          </div>
        </article>
        <article className="summary-card summary-card-trip">
          <div className="summary-icon">
            <Plane size={19} />
          </div>
          <div className="summary-label">Ближайшая поездка</div>
          <div className="summary-value">{nextTrip?.title || "Пока нет"}</div>
          <div className="summary-note">
            {nextTrip
              ? `${formatShortDate(nextTrip.startDate)}–${formatShortDate(nextTrip.endDate)}`
              : "Добавьте первый маршрут"}
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel task-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Фокус дня</span>
              <h2>Задачи на сегодня</h2>
            </div>
            <button
              className="text-button"
              onClick={() => setActive("tasks")}
              type="button"
            >
              Все задачи <ArrowRight size={16} />
            </button>
          </div>
          <div className="task-list">
            {tasks.slice(0, 3).map((task) => renderTaskRow(task, true))}
          </div>
          <button
            className="add-inline-button"
            onClick={() => openComposer("task")}
            type="button"
          >
            <Plus size={17} /> Новая задача
          </button>
        </article>

        {nextTrip ? (
          renderTripCard(nextTrip)
        ) : (
          <button
            className="panel create-trip-card"
            onClick={() => openComposer("trip")}
            type="button"
          >
            <Plane size={28} />
            <strong>Запланировать поездку</strong>
            <span>Соберите даты, отель и места в одной карточке</span>
          </button>
        )}
      </section>

      <section className="dashboard-grid dashboard-grid-bottom">
        <article className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Последние операции</span>
              <h2>Совместные траты</h2>
            </div>
            <button
              className="icon-button"
              onClick={() => setActive("finance")}
              type="button"
              aria-label="Открыть финансы"
            >
              <ArrowUpRight size={19} />
            </button>
          </div>
          <div className="expense-list">
            {expenses.slice(0, 2).map((expense) => (
              <div className="expense-row" key={expense.id}>
                <span
                  className={`expense-icon expense-icon-${categoryTone(expense.category)}`}
                >
                  {expense.category.charAt(0)}
                </span>
                <span>
                  <strong>{expense.title}</strong>
                  <small>
                    {formatShortDate(expense.startDate)} ·{" "}
                    {expense.paidBy === "me" ? "оплатили вы" : "оплатил партнёр"}
                  </small>
                </span>
                <b>−{formatMoney(expense.amount)}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="panel place-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Хотим сходить</span>
              <h2>Сохранённые места</h2>
            </div>
            <MapPin size={20} />
          </div>
          {places[0] && (
            <div className="place-stack">
              <div className="place-preview">
                <span>{places[0].category}</span>
              </div>
              <div className="place-copy">
                <strong>{places[0].title}</strong>
                <small>
                  {String(parseMeta(places[0]).city || "")} ·{" "}
                  {String(parseMeta(places[0]).rating || "без рейтинга")}
                </small>
              </div>
              <button
                className="round-button round-button-dark"
                onClick={() => setActive("plans")}
                type="button"
                aria-label="Открыть места"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </article>
      </section>
    </div>
  );

  const filteredTasks = tasks.filter((task) => {
    if (taskFilter === "today") return task.dueDate === today;
    if (taskFilter === "active") return task.status !== "done";
    if (taskFilter === "done") return task.status === "done";
    return true;
  });

  const renderTasks = () => (
    <div className="section-page">
      <section className="section-toolbar">
        <div className="filter-pills" aria-label="Фильтры задач">
          {[
            ["all", "Все"],
            ["today", "Сегодня"],
            ["active", "В работе"],
            ["done", "Готово"],
          ].map(([value, label]) => (
            <button
              className={taskFilter === value ? "is-active" : ""}
              key={value}
              onClick={() => setTaskFilter(value)}
              type="button"
            >
              {label}
              <span>
                {value === "all"
                  ? tasks.length
                  : value === "today"
                    ? tasks.filter((task) => task.dueDate === today).length
                    : value === "done"
                      ? tasks.filter((task) => task.status === "done").length
                      : tasks.filter((task) => task.status !== "done").length}
              </span>
            </button>
          ))}
        </div>
        <label className="search-box">
          <Search size={17} />
          <input placeholder="Найти задачу" />
        </label>
      </section>

      <section className="tasks-layout">
        <article className="panel task-board">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Список</span>
              <h2>
                {taskFilter === "done" ? "Выполненные" : "Актуальные задачи"}
              </h2>
            </div>
            <span className="item-counter">{filteredTasks.length}</span>
          </div>
          <div className="task-list task-list-large">
            {filteredTasks.length ? (
              filteredTasks.map((task) => renderTaskRow(task))
            ) : (
              <div className="inline-empty">
                <CheckCircle2 size={25} />
                <strong>Здесь пока пусто</strong>
                <span>Можно добавить новую задачу</span>
              </div>
            )}
          </div>
          <button
            className="add-wide-button"
            onClick={() => openComposer("task")}
            type="button"
          >
            <Plus size={18} /> Добавить задачу
          </button>
        </article>

        <aside className="task-insights">
          <article className="panel insight-card insight-card-purple">
            <span>Прогресс недели</span>
            <strong>
              {tasks.filter((task) => task.status === "done").length} из{" "}
              {tasks.length}
            </strong>
            <div className="progress-track progress-track-light">
              <span
                style={{
                  width: `${Math.round(
                    (tasks.filter((task) => task.status === "done").length /
                      Math.max(1, tasks.length)) *
                      100,
                  )}%`,
                }}
              />
            </div>
            <small>Хороший темп — продолжайте</small>
          </article>
          <article className="panel categories-card">
            <span className="panel-kicker">Направления</span>
            <h3>По категориям</h3>
            {taskCategories.slice(0, 4).map((category) => (
              <div className="category-row" key={category}>
                <i className={`category-dot category-dot-${categoryTone(category)}`} />
                <span>{category}</span>
                <b>{tasks.filter((task) => task.category === category).length}</b>
              </div>
            ))}
          </article>
        </aside>
      </section>
    </div>
  );

  const visiblePlaces =
    placeFilter === "Все"
      ? places
      : places.filter((place) => place.category === placeFilter);

  const renderPlans = () => (
    <div className="section-page">
      <section className="plans-hero">
        <div>
          <span className="panel-kicker">Следующее приключение</span>
          <h2>{nextTrip?.title || "Новая поездка"}</h2>
          <p>
            {nextTrip
              ? `${formatShortDate(nextTrip.startDate)}–${formatShortDate(nextTrip.endDate)} · все бронирования и планы в одном месте`
              : "Добавьте даты, отель, билеты и маршрут"}
          </p>
        </div>
        <button className="secondary-button" onClick={() => openComposer("trip")}>
          <Plus size={17} /> Новая поездка
        </button>
      </section>

      <section className="plans-grid">
        <div className="trip-list">
          {trips.length ? (
            trips.map((trip) => (
              <div key={trip.id}>{renderTripCard(trip, true)}</div>
            ))
          ) : (
            <div className="panel inline-empty">
              <Plane size={28} />
              <strong>Поездок пока нет</strong>
              <span>Самое время запланировать первую</span>
            </div>
          )}
        </div>

        <article className="panel trip-checklist">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Стамбул</span>
              <h2>Перед поездкой</h2>
            </div>
            <span className="item-counter">3</span>
          </div>
          {[
            ["Проверить срок действия паспортов", true],
            ["Купить страховку", true],
            ["Скачать офлайн-карту", false],
          ].map(([label, done]) => (
            <div className="checklist-row" key={String(label)}>
              <span className={done ? "is-done" : ""}>
                {done && <Check size={13} />}
              </span>
              <p className={done ? "is-done" : ""}>{String(label)}</p>
            </div>
          ))}
          <button
            className="add-inline-button"
            onClick={() => openComposer("task")}
            type="button"
          >
            <Plus size={17} /> Добавить пункт
          </button>
        </article>
      </section>

      <section className="places-section">
        <div className="section-subheading">
          <div>
            <span className="panel-kicker">Коллекция для двоих</span>
            <h2>Куда хотим сходить</h2>
          </div>
          <button className="secondary-button" onClick={() => openComposer("place")}>
            <Plus size={17} /> Добавить место
          </button>
        </div>
        <div className="filter-pills filter-pills-compact">
          {["Все", "Кафе", "Ресторан", "Достопримечательности"].map((category) => (
            <button
              className={placeFilter === category ? "is-active" : ""}
              key={category}
              onClick={() => setPlaceFilter(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>
        <div className="place-grid">
          {visiblePlaces.map((place, index) => {
            const meta = parseMeta(place);
            return (
              <article className="panel place-card" key={place.id}>
                <div className={`place-card-art place-card-art-${(index % 3) + 1}`}>
                  <span>{place.category}</span>
                  <button
                    className={`place-check ${place.status === "visited" ? "is-visited" : ""}`}
                    onClick={() =>
                      void syncUpdate(place.id, {
                        status: place.status === "visited" ? "saved" : "visited",
                      })
                    }
                    type="button"
                    aria-label="Отметить посещённым"
                  >
                    <Check size={14} />
                  </button>
                </div>
                <div className="place-card-content">
                  <div>
                    <h3>{place.title}</h3>
                    <p>
                      {String(meta.city || "Город не указан")} ·{" "}
                      {String(meta.rating || "без рейтинга")}
                    </p>
                  </div>
                  <p className="place-note">
                    {String(meta.note || place.description || "Без заметки")}
                  </p>
                  <div className="card-actions">
                    {place.link && (
                      <a href={place.link} target="_blank" rel="noreferrer">
                        На карте <ExternalLink size={13} />
                      </a>
                    )}
                    <button
                      onClick={() => void removeItem(place.id)}
                      type="button"
                      aria-label={`Удалить ${place.title}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );

  const categoryTotals = expenseCategories
    .map((category) => ({
      category,
      total: expenses
        .filter((expense) => expense.category === category)
        .reduce((sum, expense) => sum + (expense.amount || 0), 0),
    }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);
  const maxCategory = Math.max(1, ...categoryTotals.map((row) => row.total));

  const renderFinance = () => (
    <div className="section-page">
      <section className="finance-summary">
        <article className="finance-hero">
          <div className="finance-hero-top">
            <span>Общие расходы за месяц</span>
            <CircleDollarSign size={22} />
          </div>
          <strong>{formatMoney(monthSpent)}</strong>
          <div className="budget-line">
            <span>Бюджет {formatMoney(budget)}</span>
            <b>{budgetPercent}%</b>
          </div>
          <div className="progress-track progress-track-light">
            <span style={{ width: `${budgetPercent}%` }} />
          </div>
          <small>Осталось {formatMoney(Math.max(0, budget - monthSpent))}</small>
        </article>
        <article className="panel finance-mini-card">
          <span className="finance-mini-icon">
            <ArrowLeftRight size={20} />
          </span>
          <small>Баланс между вами</small>
          <strong className={balance >= 0 ? "positive" : "negative"}>
            {formatMoney(balance, true)}
          </strong>
          <p>{balance >= 0 ? "Партнёр должен вам" : "Вы должны партнёру"}</p>
        </article>
        <article className="panel finance-mini-card">
          <span className="finance-mini-icon finance-mini-icon-peach">
            <ReceiptText size={20} />
          </span>
          <small>Операций в июле</small>
          <strong>{expenses.length}</strong>
          <p>{expenses.filter((item) => item.status === "shared").length} общих</p>
        </article>
      </section>

      <section className="finance-grid">
        <article className="panel expense-history">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">История</span>
              <h2>Последние траты</h2>
            </div>
            <button
              className="secondary-button secondary-button-small"
              onClick={() => openComposer("expense")}
              type="button"
            >
              <Plus size={16} /> Расход
            </button>
          </div>
          <div className="expense-table">
            {expenses.map((expense) => (
              <div className="expense-table-row" key={expense.id}>
                <span
                  className={`expense-icon expense-icon-${categoryTone(expense.category)}`}
                >
                  {expense.category.charAt(0)}
                </span>
                <span className="expense-main">
                  <strong>{expense.title}</strong>
                  <small>
                    {expense.category} · {formatShortDate(expense.startDate)}
                  </small>
                </span>
                <span className="payer">
                  {expense.paidBy === "me" ? "Вы" : "Партнёр"}
                </span>
                <b>−{formatMoney(expense.amount)}</b>
                <button
                  className="row-action"
                  onClick={() => void removeItem(expense.id)}
                  type="button"
                  aria-label={`Удалить ${expense.title}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </article>

        <article className="panel category-chart">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Структура расходов</span>
              <h2>По категориям</h2>
            </div>
            <span className="chart-month">Июль</span>
          </div>
          <div className="category-bars">
            {categoryTotals.map((row) => (
              <div className="category-bar-row" key={row.category}>
                <div>
                  <span>{row.category}</span>
                  <b>{formatMoney(row.total)}</b>
                </div>
                <i>
                  <span
                    className={`bar-${categoryTone(row.category)}`}
                    style={{ width: `${(row.total / maxCategory) * 100}%` }}
                  />
                </i>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );

  const renderMore = () => (
    <div className="section-page">
      <section className="wish-intro">
        <div>
          <span className="panel-kicker">Общий список</span>
          <h2>Сохраняйте всё, что хочется купить</h2>
          <p>
            Добавьте ссылку из Ozon, Яндекс Маркета или любого другого магазина —
            карточку всегда можно дополнить вручную.
          </p>
        </div>
        <button className="secondary-button" onClick={() => openComposer("wish")}>
          <Plus size={17} /> Добавить хотелку
        </button>
      </section>

      <section className="wish-layout">
        <div className="wish-grid">
          {wishes.map((wish, index) => (
            <article className="panel wish-card" key={wish.id}>
              <div className={`wish-art wish-art-${(index % 3) + 1}`}>
                {wish.category === "Техника" ? (
                  <Sparkles size={34} />
                ) : (
                  <Gift size={34} />
                )}
                <span className="owner-badge">
                  {wish.createdBy === "me"
                    ? initials(viewerName)
                    : initials("Партнёр")}
                </span>
              </div>
              <div className="wish-content">
                <span>{getHost(wish.link)}</span>
                <h3>{wish.title}</h3>
                <p>{wish.description || wish.category}</p>
                <div className="wish-price">{formatMoney(wish.amount)}</div>
                <div className="card-actions">
                  {wish.link ? (
                    <a href={wish.link} target="_blank" rel="noreferrer">
                      Открыть <ExternalLink size={13} />
                    </a>
                  ) : (
                    <span>Без ссылки</span>
                  )}
                  <button
                    onClick={() => void removeItem(wish.id)}
                    type="button"
                    aria-label={`Удалить ${wish.title}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
          <button
            className="wish-add-card"
            onClick={() => openComposer("wish")}
            type="button"
          >
            <span>
              <Plus size={21} />
            </span>
            <strong>Добавить ссылку</strong>
            <small>Товар появится в общем списке</small>
          </button>
        </div>

        <aside className="more-aside">
          <article className="panel inbox-card">
            <span className="inbox-icon">
              <ShoppingBag size={20} />
            </span>
            <div>
              <span className="panel-kicker">Входящие</span>
              <h3>Быстрое сохранение</h3>
              <p>
                Скопируйте ссылку и добавьте её через кнопку — разберём по
                категориям позже.
              </p>
            </div>
            <button onClick={() => openComposer("wish")} type="button">
              Добавить <ArrowRight size={15} />
            </button>
          </article>
          <article className="panel space-card">
            <div className="space-avatars">
              <span>{initials(viewerName)}</span>
              <span>П</span>
            </div>
            <h3>Одно пространство на двоих</h3>
            <p>
              Автор каждой задачи, траты, поездки и хотелки отображается в
              карточке.
            </p>
          </article>
        </aside>
      </section>
    </div>
  );

  const renderActive = () => {
    if (active === "tasks") return renderTasks();
    if (active === "plans") return renderPlans();
    if (active === "finance") return renderFinance();
    if (active === "more") return renderMore();
    return renderHome();
  };

  if (loading) {
    return (
      <main className="access-shell">
        <section className="access-card" aria-live="polite">
          <div className="brand-mark access-brand">
            <Sparkles size={22} strokeWidth={2.4} />
          </div>
          <h1>Self‑Planner</h1>
          <p>Проверяем безопасный вход через Telegram…</p>
        </section>
      </main>
    );
  }

  if (accessError) {
    return (
      <main className="access-shell">
        <section className="access-card" role="alert">
          <div className="brand-mark access-brand">
            <Sparkles size={22} strokeWidth={2.4} />
          </div>
          <h1>Self‑Planner</h1>
          <p>{accessError}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="side-nav" aria-label="Основная навигация">
        <button
          className="brand-mark"
          aria-label="На главную"
          onClick={() => setActive("home")}
          type="button"
        >
          <Sparkles size={19} strokeWidth={2.4} />
        </button>
        <div className="side-nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={`side-nav-item ${active === item.key ? "is-active" : ""}`}
                key={item.key}
                onClick={() => setActive(item.key)}
                type="button"
              >
                <Icon size={20} strokeWidth={2.1} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
        <div
          className="profile-avatar profile-avatar-side"
          title={displayName}
        >
          {initials(displayName)}
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <div className="eyebrow">{sectionCopy[active].eyebrow}</div>
            <h1>
              {active === "home"
                ? `${sectionCopy[active].title}, ${displayName}`
                : sectionCopy[active].title}
            </h1>
          </div>
          <div className="topbar-actions">
            {offline && (
              <span className="sync-pill">
                Нет соединения
              </span>
            )}
            <div
              className="people-chip"
              aria-label="Участники общего пространства"
            >
              <span className="mini-avatar mini-avatar-primary">
                {initials(viewerName)}
              </span>
              <span className="mini-avatar mini-avatar-secondary">П</span>
              <span>Общее пространство</span>
            </div>
            <button
              className="primary-button"
              onClick={() => openComposer(sectionCopy[active].actionKind)}
              type="button"
            >
              <Plus size={18} strokeWidth={2.5} />
              Добавить
            </button>
          </div>
        </header>

        {renderActive()}
      </section>

      <nav className="mobile-nav" aria-label="Основная навигация">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={active === item.key ? "is-active" : ""}
              key={item.key}
              onClick={() => setActive(item.key)}
              type="button"
            >
              <Icon size={20} strokeWidth={2.1} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <button
        className="mobile-fab"
        onClick={() => openComposer(sectionCopy[active].actionKind)}
        type="button"
        aria-label="Добавить"
      >
        <Plus size={23} strokeWidth={2.7} />
      </button>

      {composer.open && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setComposer((current) => ({ ...current, open: false }));
            }
          }}
        >
          <section
            className="composer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="composer-title"
          >
            <div className="composer-header">
              <div>
                <span>Новая запись</span>
                <h2 id="composer-title">Добавить во «Вместе»</h2>
              </div>
              <button
                onClick={() =>
                  setComposer((current) => ({ ...current, open: false }))
                }
                type="button"
                aria-label="Закрыть"
              >
                <X size={19} />
              </button>
            </div>

            <div className="type-picker" aria-label="Тип записи">
              {(
                [
                  ["task", "Задача", ListChecks],
                  ["expense", "Расход", ReceiptText],
                  ["trip", "Поездка", Plane],
                  ["place", "Место", MapPin],
                  ["wish", "Хотелка", Gift],
                ] as Array<
                  [ComposerState["kind"], string, typeof ListChecks]
                >
              ).map(([kind, label, Icon]) => (
                <button
                  className={composer.kind === kind ? "is-active" : ""}
                  key={kind}
                  onClick={() =>
                    setComposer((current) => ({ ...current, kind }))
                  }
                  type="button"
                >
                  <Icon size={17} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <form className="composer-form" onSubmit={createItem}>
              <label className="field field-wide">
                <span>
                  {composer.kind === "expense"
                    ? "На что потратили"
                    : composer.kind === "place"
                      ? "Название места"
                      : composer.kind === "wish"
                        ? "Что хочется"
                        : composer.kind === "trip"
                          ? "Куда едем"
                          : "Название задачи"}
                </span>
                <input
                  autoFocus
                  name="title"
                  placeholder={
                    composer.kind === "expense"
                      ? "Например, продукты"
                      : "Введите название"
                  }
                  required
                />
              </label>

              {composer.kind === "task" && (
                <>
                  <label className="field">
                    <span>Направление</span>
                    <select name="category" defaultValue="Дом">
                      {taskCategories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Срок</span>
                    <input name="dueDate" type="date" defaultValue={today} />
                  </label>
                  <label className="field">
                    <span>Исполнитель</span>
                    <select name="assignedTo" defaultValue={viewerId}>
                      <option value="me">Я</option>
                      <option value="partner">Партнёр</option>
                      <option value="both">Вместе</option>
                    </select>
                  </label>
                </>
              )}

              {composer.kind === "expense" && (
                <>
                  <label className="field">
                    <span>Сумма, ₽</span>
                    <input
                      min="0"
                      name="amount"
                      placeholder="0"
                      required
                      step="0.01"
                      type="number"
                    />
                  </label>
                  <label className="field">
                    <span>Категория</span>
                    <select name="category" defaultValue="Продукты">
                      {expenseCategories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Кто оплатил</span>
                    <select name="paidBy" defaultValue={viewerId}>
                      <option value="me">Я</option>
                      <option value="partner">Партнёр</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Как учесть</span>
                    <select name="sharing" defaultValue="shared">
                      <option value="shared">Общая, 50/50</option>
                      <option value="personal">Личная</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Дата</span>
                    <input name="startDate" type="date" defaultValue={today} />
                  </label>
                </>
              )}

              {composer.kind === "trip" && (
                <>
                  <label className="field">
                    <span>Дата начала</span>
                    <input name="startDate" required type="date" />
                  </label>
                  <label className="field">
                    <span>Дата окончания</span>
                    <input name="endDate" required type="date" />
                  </label>
                  <label className="field field-wide">
                    <span>Отель</span>
                    <input name="hotel" placeholder="Название или ссылка" />
                  </label>
                </>
              )}

              {composer.kind === "place" && (
                <>
                  <label className="field">
                    <span>Категория</span>
                    <select name="category" defaultValue="Кафе">
                      {placeCategories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Город</span>
                    <input name="city" placeholder="Москва" />
                  </label>
                  <label className="field field-wide">
                    <span>Ссылка на карту</span>
                    <input name="link" placeholder="https://..." type="url" />
                  </label>
                </>
              )}

              {composer.kind === "wish" && (
                <>
                  <label className="field field-wide">
                    <span>Ссылка на товар</span>
                    <input name="link" placeholder="https://..." type="url" />
                  </label>
                  <label className="field">
                    <span>Категория</span>
                    <select name="category" defaultValue="Покупки">
                      <option>Покупки</option>
                      <option>Техника</option>
                      <option>Дом</option>
                      <option>Одежда</option>
                      <option>Путешествия</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Цена, ₽</span>
                    <input min="0" name="amount" placeholder="Необязательно" type="number" />
                  </label>
                </>
              )}

              <label className="field field-wide">
                <span>Заметка</span>
                <textarea
                  name="description"
                  placeholder="Добавьте детали, если нужно"
                  rows={3}
                />
              </label>

              <div className="composer-footer">
                <span>
                  Добавит: <b>{displayName}</b>
                </span>
                <button className="primary-button" type="submit">
                  Добавить
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
