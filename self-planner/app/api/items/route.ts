import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { items } from "../../../db/schema";

const allowedKinds = new Set([
  "task",
  "trip",
  "place",
  "wish",
  "expense",
  "budget",
]);

const sampleItems: Array<typeof items.$inferInsert> = [
  {
    id: "task-internet",
    kind: "task",
    title: "Оплатить интернет",
    category: "Дом",
    status: "active",
    dueDate: "2026-07-30",
    assignedTo: "me",
    createdBy: "me",
  },
  {
    id: "task-documents",
    kind: "task",
    title: "Собрать документы для поездки",
    category: "Путешествия",
    status: "active",
    dueDate: "2026-08-02",
    assignedTo: "both",
    createdBy: "me",
  },
  {
    id: "task-food",
    kind: "task",
    title: "Заказать корм",
    category: "Дом",
    status: "done",
    dueDate: "2026-07-29",
    assignedTo: "partner",
    createdBy: "partner",
  },
  {
    id: "trip-istanbul",
    kind: "trip",
    title: "Стамбул",
    description: "The Galata Istanbul — MGallery",
    category: "Путешествия",
    status: "active",
    startDate: "2026-09-10",
    endDate: "2026-09-15",
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
    link: "https://market.yandex.ru/",
    createdBy: "me",
  },
  {
    id: "wish-coffee",
    kind: "wish",
    title: "Кофемолка Timemore",
    category: "Дом",
    status: "saved",
    amount: 1299000,
    link: "https://www.ozon.ru/",
    createdBy: "partner",
  },
  {
    id: "expense-maya",
    kind: "expense",
    title: "Ресторан Maya",
    category: "Кафе и рестораны",
    status: "shared",
    amount: 480000,
    paidBy: "me",
    startDate: "2026-07-29",
    metadata: JSON.stringify({ splitMe: 50 }),
    createdBy: "me",
  },
  {
    id: "expense-home",
    kind: "expense",
    title: "Товары для дома",
    category: "Дом",
    status: "shared",
    amount: 234000,
    paidBy: "partner",
    startDate: "2026-07-28",
    metadata: JSON.stringify({ splitMe: 50 }),
    createdBy: "partner",
  },
  {
    id: "expense-groceries",
    kind: "expense",
    title: "Продукты",
    category: "Продукты",
    status: "shared",
    amount: 785000,
    paidBy: "partner",
    startDate: "2026-07-25",
    metadata: JSON.stringify({ splitMe: 50 }),
    createdBy: "partner",
  },
  {
    id: "expense-taxi",
    kind: "expense",
    title: "Такси",
    category: "Транспорт",
    status: "personal",
    amount: 126000,
    paidBy: "me",
    startDate: "2026-07-23",
    metadata: JSON.stringify({ splitMe: 100 }),
    createdBy: "me",
  },
  {
    id: "budget-july",
    kind: "budget",
    title: "Бюджет на июль",
    category: "Общий бюджет",
    status: "active",
    amount: 12000000,
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    createdBy: "both",
  },
];

function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Неизвестная ошибка";
  const detail =
    error instanceof Error && error.cause instanceof Error
      ? error.cause.message
      : "";
  const combined = `${message}\n${detail}`;

  if (combined.includes("no such table") || combined.includes('from "items"')) {
    return "Хранилище ещё не подготовлено. Примените миграцию и повторите попытку.";
  }

  return message;
}

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const spaceId = url.searchParams.get("spaceId") || "shared";
    const db = getDb();

    let rows = await db
      .select()
      .from(items)
      .where(eq(items.spaceId, spaceId))
      .orderBy(asc(items.kind), desc(items.createdAt));

    if (rows.length === 0 && spaceId === "shared") {
      await db.insert(items).values(sampleItems).onConflictDoNothing();
      rows = await db
        .select()
        .from(items)
        .where(eq(items.spaceId, spaceId))
        .orderBy(asc(items.kind), desc(items.createdAt));
    }

    return Response.json({ items: rows });
  } catch (error) {
    return Response.json({ error: apiError(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = cleanText(body.action, "create");
    const db = getDb();

    if (action === "delete") {
      const id = cleanText(body.id);
      if (!id) {
        return Response.json({ error: "Не указан id" }, { status: 400 });
      }
      await db
        .delete(items)
        .where(and(eq(items.id, id), eq(items.spaceId, "shared")));
      return Response.json({ ok: true });
    }

    if (action === "update") {
      const id = cleanText(body.id);
      if (!id) {
        return Response.json({ error: "Не указан id" }, { status: 400 });
      }

      const patch: Partial<typeof items.$inferInsert> = {
        updatedAt: new Date().toISOString(),
      };
      const textFields = [
        "title",
        "description",
        "category",
        "status",
        "paidBy",
        "assignedTo",
        "dueDate",
        "startDate",
        "endDate",
        "link",
        "metadata",
      ] as const;

      for (const field of textFields) {
        if (field in body) {
          patch[field] = cleanText(body[field]);
        }
      }
      if ("amount" in body) {
        patch.amount =
          typeof body.amount === "number" && Number.isFinite(body.amount)
            ? Math.round(body.amount)
            : null;
      }

      const [updated] = await db
        .update(items)
        .set(patch)
        .where(and(eq(items.id, id), eq(items.spaceId, "shared")))
        .returning();
      return Response.json({ item: updated });
    }

    const kind = cleanText(body.kind);
    const title = cleanText(body.title);
    if (!allowedKinds.has(kind) || !title) {
      return Response.json(
        { error: "Нужно указать тип и название записи" },
        { status: 400 },
      );
    }

    const record: typeof items.$inferInsert = {
      id: crypto.randomUUID(),
      spaceId: "shared",
      kind,
      title,
      description: cleanText(body.description),
      category: cleanText(body.category, "Другое"),
      status: cleanText(body.status, "active"),
      amount:
        typeof body.amount === "number" && Number.isFinite(body.amount)
          ? Math.round(body.amount)
          : null,
      paidBy: cleanText(body.paidBy) || null,
      assignedTo: cleanText(body.assignedTo) || null,
      dueDate: cleanText(body.dueDate) || null,
      startDate: cleanText(body.startDate) || null,
      endDate: cleanText(body.endDate) || null,
      link: cleanText(body.link) || null,
      metadata:
        typeof body.metadata === "string" ? body.metadata : JSON.stringify({}),
      createdBy: cleanText(body.createdBy, "me"),
    };

    const [created] = await db.insert(items).values(record).returning();
    return Response.json({ item: created }, { status: 201 });
  } catch (error) {
    return Response.json({ error: apiError(error) }, { status: 500 });
  }
}
