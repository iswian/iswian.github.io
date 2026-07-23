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
);

CREATE INDEX IF NOT EXISTS idx_diary_milk_tea_date
ON DiaryMilkTea(date);
