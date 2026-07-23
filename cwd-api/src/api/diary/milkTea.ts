import { Context } from 'hono';
import { Bindings } from '../../bindings';

type DiaryMilkTeaRow = {
  id: string;
  date: string;
  brand: string;
  drink: string;
  sugar: string;
  ice: string;
  toppings: string;
  price: number;
  rating: number;
  note: string;
  created: number;
};

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS DiaryMilkTea (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT '',
    drink TEXT NOT NULL,
    sugar TEXT NOT NULL DEFAULT '',
    ice TEXT NOT NULL DEFAULT '',
    toppings TEXT NOT NULL DEFAULT '',
    price REAL NOT NULL DEFAULT 0,
    rating INTEGER NOT NULL DEFAULT 0,
    note TEXT NOT NULL DEFAULT '',
    created INTEGER NOT NULL
  )
`;

async function ensureTable(env: Bindings) {
  await env.CWD_DB.prepare(CREATE_TABLE_SQL).run();
  await env.CWD_DB.prepare(
    'CREATE INDEX IF NOT EXISTS idx_diary_milk_tea_date ON DiaryMilkTea(date)'
  ).run();
}

function normalizeBody(body: any) {
  const date = typeof body?.date === 'string' ? body.date.trim() : '';
  const brand = typeof body?.brand === 'string' ? body.brand.trim().slice(0, 100) : '';
  const drink = typeof body?.drink === 'string' ? body.drink.trim().slice(0, 100) : '';
  const sugar = typeof body?.sugar === 'string' ? body.sugar.trim().slice(0, 50) : '';
  const ice = typeof body?.ice === 'string' ? body.ice.trim().slice(0, 50) : '';
  const toppings = typeof body?.toppings === 'string' ? body.toppings.trim().slice(0, 200) : '';
  const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 1000) : '';
  const rawPrice = Number(body?.price);
  const rawRating = Number(body?.rating);
  const price = Number.isFinite(rawPrice) ? Math.max(0, Math.min(rawPrice, 99999)) : 0;
  const rating = Number.isFinite(rawRating) ? Math.max(0, Math.min(Math.round(rawRating), 5)) : 0;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: '日期格式不正确' as const };
  }
  if (!drink) {
    return { error: '奶茶名称不能为空' as const };
  }

  return { value: { date, brand, drink, sugar, ice, toppings, price, rating, note } };
}

function toEntry(row: DiaryMilkTeaRow) {
  return {
    id: row.id,
    date: row.date,
    brand: row.brand,
    drink: row.drink,
    sugar: row.sugar,
    ice: row.ice,
    toppings: row.toppings,
    price: Number(row.price) || 0,
    rating: Number(row.rating) || 0,
    note: row.note,
    createdAt: Number(row.created) || 0,
  };
}

export const listMilkTeaEntries = async (c: Context<{ Bindings: Bindings }>) => {
  await ensureTable(c.env);
  const year = c.req.query('year')?.trim();

  const statement = year && /^\d{4}$/.test(year)
    ? c.env.CWD_DB.prepare(
        'SELECT * FROM DiaryMilkTea WHERE date >= ? AND date <= ? ORDER BY date DESC, created DESC'
      ).bind(`${year}-01-01`, `${year}-12-31`)
    : c.env.CWD_DB.prepare(
        'SELECT * FROM DiaryMilkTea ORDER BY date DESC, created DESC LIMIT 2000'
      );

  const { results } = await statement.all<DiaryMilkTeaRow>();
  return c.json({ data: results.map(toEntry) });
};

export const createMilkTeaEntry = async (c: Context<{ Bindings: Bindings }>) => {
  await ensureTable(c.env);
  const normalized = normalizeBody(await c.req.json());
  if ('error' in normalized) return c.json({ message: normalized.error }, 400);

  const id = crypto.randomUUID();
  const createdAt = Date.now();
  const value = normalized.value;
  await c.env.CWD_DB.prepare(`
    INSERT INTO DiaryMilkTea
      (id, date, brand, drink, sugar, ice, toppings, price, rating, note, created)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      id,
      value.date,
      value.brand,
      value.drink,
      value.sugar,
      value.ice,
      value.toppings,
      value.price,
      value.rating,
      value.note,
      createdAt
    )
    .run();

  return c.json({ data: { id, ...value, createdAt } }, 201);
};

export const updateMilkTeaEntry = async (c: Context<{ Bindings: Bindings }>) => {
  await ensureTable(c.env);
  const body = await c.req.json();
  const id = typeof body?.id === 'string' ? body.id.trim() : '';
  if (!id) return c.json({ message: '缺少记录 ID' }, 400);

  const normalized = normalizeBody(body);
  if ('error' in normalized) return c.json({ message: normalized.error }, 400);
  const value = normalized.value;
  const result = await c.env.CWD_DB.prepare(`
    UPDATE DiaryMilkTea
    SET date = ?, brand = ?, drink = ?, sugar = ?, ice = ?, toppings = ?,
        price = ?, rating = ?, note = ?
    WHERE id = ?
  `)
    .bind(
      value.date,
      value.brand,
      value.drink,
      value.sugar,
      value.ice,
      value.toppings,
      value.price,
      value.rating,
      value.note,
      id
    )
    .run();

  if (!result.meta.changes) return c.json({ message: '记录不存在' }, 404);
  const row = await c.env.CWD_DB.prepare('SELECT * FROM DiaryMilkTea WHERE id = ?')
    .bind(id)
    .first<DiaryMilkTeaRow>();
  return c.json({ data: row ? toEntry(row) : null });
};

export const deleteMilkTeaEntry = async (c: Context<{ Bindings: Bindings }>) => {
  await ensureTable(c.env);
  const id = c.req.query('id')?.trim();
  if (!id) return c.json({ message: '缺少记录 ID' }, 400);

  const result = await c.env.CWD_DB.prepare('DELETE FROM DiaryMilkTea WHERE id = ?')
    .bind(id)
    .run();
  if (!result.meta.changes) return c.json({ message: '记录不存在' }, 404);
  return c.json({ message: '已删除' });
};

export const getDiarySession = async (c: Context<{ Bindings: Bindings }>) => {
  return c.json({ data: { authenticated: true } });
};
