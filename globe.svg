import { neon } from "@neondatabase/serverless";
import { userRole, verifyTelegramRequest } from "../../telegram-auth";

export const runtime = "nodejs";

const allowedKinds = new Set([
  "task",
  "trip",
  "place",
  "wish",
  "expense",
  "budget",
]);

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

async function ensureTable(sql: ReturnType<typeof db>) {
  await sql`
    CREATE TABLE IF NOT EXISTS items (
      id text PRIMARY KEY,
      space_id text NOT NULL DEFAULT 'shared',
      kind text NOT NULL,
      title text NOT NULL,
      description text NOT NULL DEFAULT '',
      category text NOT NULL DEFAULT 'Другое',
      status text NOT NULL DEFAULT 'active',
      amount integer,
      currency text NOT NULL DEFAULT 'RUB',
      paid_by text,
      assigned_to text,
      due_date text,
      start_date text,
      end_date text,
      link text,
      metadata text NOT NULL DEFAULT '{}',
      created_by text NOT NULL DEFAULT 'me',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
}

function clean(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalize(row: Record<string, unknown>) {
  return {
    id: row.id,
    spaceId: row.space_id,
    kind: row.kind,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status,
    amount: row.amount,
    currency: row.currency,
    paidBy: row.paid_by,
    assignedTo: row.assigned_to,
    dueDate: row.due_date,
    startDate: row.start_date,
    endDate: row.end_date,
    link: row.link,
    metadata: row.metadata,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function denied(error: unknown) {
  const message = error instanceof Error ? error.message : "Access denied";
  const authError =
    message.includes("Telegram") ||
    message.includes("signature") ||
    message.includes("Access denied");
  return Response.json({ error: message }, { status: authError ? 401 : 500 });
}

export async function GET(request: Request) {
  try {
    verifyTelegramRequest(request);
    const sql = db();
    await ensureTable(sql);
    const rows = await sql`
      SELECT * FROM items
      WHERE space_id = 'shared'
      ORDER BY kind ASC, created_at DESC
    `;
    return Response.json({ items: rows.map(normalize) });
  } catch (error) {
    return denied(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = verifyTelegramRequest(request);
    const role = userRole(user.id);
    const body = (await request.json()) as Record<string, unknown>;
    const sql = db();
    await ensureTable(sql);
    const action = clean(body.action, "create");
    const id = clean(body.id);

    if (action === "delete") {
      if (!id) return Response.json({ error: "Не указан id" }, { status: 400 });
      await sql`DELETE FROM items WHERE id = ${id} AND space_id = 'shared'`;
      return Response.json({ ok: true });
    }

    if (action === "update") {
      if (!id) return Response.json({ error: "Не указан id" }, { status: 400 });
      const current = await sql`
        SELECT * FROM items WHERE id = ${id} AND space_id = 'shared' LIMIT 1
      `;
      if (!current[0]) {
        return Response.json({ error: "Запись не найдена" }, { status: 404 });
      }
      const old = current[0] as Record<string, unknown>;
      const value = (key: string, column: string) =>
        key in body ? clean(body[key]) : clean(old[column]);
      const amount =
        "amount" in body && typeof body.amount === "number"
          ? Math.round(body.amount)
          : (old.amount as number | null);
      const rows = await sql`
        UPDATE items SET
          title = ${value("title", "title")},
          description = ${value("description", "description")},
          category = ${value("category", "category")},
          status = ${value("status", "status")},
          amount = ${amount},
          paid_by = ${value("paidBy", "paid_by") || null},
          assigned_to = ${value("assignedTo", "assigned_to") || null},
          due_date = ${value("dueDate", "due_date") || null},
          start_date = ${value("startDate", "start_date") || null},
          end_date = ${value("endDate", "end_date") || null},
          link = ${value("link", "link") || null},
          metadata = ${value("metadata", "metadata") || "{}"},
          updated_at = now()
        WHERE id = ${id} AND space_id = 'shared'
        RETURNING *
      `;
      return Response.json({ item: normalize(rows[0] as Record<string, unknown>) });
    }

    const kind = clean(body.kind);
    const title = clean(body.title);
    if (!allowedKinds.has(kind) || !title) {
      return Response.json(
        { error: "Нужно указать тип и название записи" },
        { status: 400 },
      );
    }

    const newId = crypto.randomUUID();
    const amount =
      typeof body.amount === "number" ? Math.round(body.amount) : null;
    const rows = await sql`
      INSERT INTO items (
        id, kind, title, description, category, status, amount, currency,
        paid_by, assigned_to, due_date, start_date, end_date, link, metadata,
        created_by
      ) VALUES (
        ${newId}, ${kind}, ${title}, ${clean(body.description)},
        ${clean(body.category, "Другое")}, ${clean(body.status, "active")},
        ${amount}, 'RUB', ${clean(body.paidBy) || null},
        ${clean(body.assignedTo) || null}, ${clean(body.dueDate) || null},
        ${clean(body.startDate) || null}, ${clean(body.endDate) || null},
        ${clean(body.link) || null}, ${clean(body.metadata) || "{}"}, ${role}
      )
      RETURNING *
    `;
    return Response.json(
      { item: normalize(rows[0] as Record<string, unknown>) },
      { status: 201 },
    );
  } catch (error) {
    return denied(error);
  }
}
