"""Sentetik satış/stok/finans/müşteri verisi üretir (Gün 2).

Gerçek kurumsal veri kullanılmaz (CLAUDE.md § Bağlam). Üretilen CSV'ler,
M01'in yükleme/temizleme akışını ve M04'ün zaman serisi tahminini
gösterebilmesi için trend + haftalık/yıllık mevsimsellik + gürültü ve
~%5 kasıtlı kirli kayıt (eksik değer, aykırı değer, tip hatası,
duplikasyon) içerir.

Kullanım:
    python scripts/generate_data.py [--seed 42] [--output-dir data/synthetic]
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

N_DAYS = 730  # ~2 yıl (SRS §8.2: SARIMA/Prophet için yeterli, LSTM için yetersiz)
START_DATE = "2024-01-01"

CATEGORIES = ["Elektronik", "Giyim", "Gıda", "Ev & Yaşam", "Kozmetik", "Spor", "Kitap", "Oyuncak"]
CITIES = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Konya", "Gaziantep"]
SEGMENTS = ["Bireysel", "Kurumsal", "Bayi"]
WAREHOUSES = ["Depo-Istanbul", "Depo-Ankara"]
FINANCE_CATEGORIES = ["satis_geliri", "tedarik_gideri", "personel_gideri", "pazarlama_gideri", "diger_gider"]

N_PRODUCTS = 30
N_CUSTOMERS = 500

DIRTY_FRACTION = 0.05  # toplam kirli kayıt oranı, 4 tipe eşit dağıtılır


def generate_products(rng: np.random.Generator) -> pd.DataFrame:
    return pd.DataFrame(
        {
            "product_id": [f"P{idx:03d}" for idx in range(1, N_PRODUCTS + 1)],
            "product_name": [f"Ürün {idx:03d}" for idx in range(1, N_PRODUCTS + 1)],
            "category": rng.choice(CATEGORIES, size=N_PRODUCTS),
            "unit_price": np.round(rng.uniform(20, 2000, size=N_PRODUCTS), 2),
            "base_daily_demand": rng.uniform(5, 60, size=N_PRODUCTS),
        }
    )


def generate_customers(rng: np.random.Generator) -> pd.DataFrame:
    signup_dates = pd.to_datetime(START_DATE) - pd.to_timedelta(
        rng.integers(0, 365 * 3, size=N_CUSTOMERS), unit="D"
    )
    return pd.DataFrame(
        {
            "customer_id": [f"C{idx:04d}" for idx in range(1, N_CUSTOMERS + 1)],
            "customer_name": [f"Müşteri {idx:04d}" for idx in range(1, N_CUSTOMERS + 1)],
            "segment": rng.choice(SEGMENTS, size=N_CUSTOMERS, p=[0.7, 0.2, 0.1]),
            "city": rng.choice(CITIES, size=N_CUSTOMERS),
            "signup_date": signup_dates.strftime("%Y-%m-%d"),
        }
    )


def generate_sales(rng: np.random.Generator, products: pd.DataFrame, customers: pd.DataFrame) -> pd.DataFrame:
    dates = pd.date_range(START_DATE, periods=N_DAYS, freq="D")
    rows = []
    for _, product in products.iterrows():
        day_index = np.arange(N_DAYS)
        dow = dates.dayofweek.to_numpy()
        doy = dates.dayofyear.to_numpy()

        trend = product["base_daily_demand"] * 0.15 * (day_index / N_DAYS)
        weekly_seasonality = product["base_daily_demand"] * 0.25 * np.sin(2 * np.pi * dow / 7 + np.pi)
        yearly_seasonality = product["base_daily_demand"] * 0.35 * np.sin(2 * np.pi * doy / 365 - np.pi / 2)
        noise = rng.normal(0, product["base_daily_demand"] * 0.15, size=N_DAYS)

        quantity = np.clip(
            np.round(product["base_daily_demand"] + trend + weekly_seasonality + yearly_seasonality + noise),
            0,
            None,
        ).astype(int)

        discount = rng.uniform(0.0, 0.1, size=N_DAYS)
        revenue = np.round(quantity * product["unit_price"] * (1 - discount), 2)
        customer_ids = rng.choice(customers["customer_id"], size=N_DAYS)

        rows.append(
            pd.DataFrame(
                {
                    "date": dates.strftime("%Y-%m-%d"),
                    "product_id": product["product_id"],
                    "customer_id": customer_ids,
                    "quantity": quantity,
                    "unit_price": product["unit_price"],
                    "revenue": revenue,
                }
            )
        )
    return pd.concat(rows, ignore_index=True)


def generate_inventory(rng: np.random.Generator, products: pd.DataFrame, sales: pd.DataFrame) -> pd.DataFrame:
    dates = pd.date_range(START_DATE, periods=N_DAYS, freq="D")
    daily_qty = sales.pivot_table(index="date", columns="product_id", values="quantity", aggfunc="sum").fillna(0)
    daily_qty = daily_qty.reindex(dates.strftime("%Y-%m-%d"), fill_value=0)

    rows = []
    for _, product in products.iterrows():
        for warehouse in WAREHOUSES:
            reorder_point = int(product["base_daily_demand"] * 7)
            stock_level = int(product["base_daily_demand"] * 30)
            levels = []
            sold = daily_qty[product["product_id"]].to_numpy() / len(WAREHOUSES)
            for day_sold in sold:
                stock_level -= int(round(day_sold))
                if stock_level < reorder_point:
                    stock_level += int(product["base_daily_demand"] * 45)  # yeniden stoklama
                levels.append(max(stock_level, 0))
            rows.append(
                pd.DataFrame(
                    {
                        "date": dates.strftime("%Y-%m-%d"),
                        "product_id": product["product_id"],
                        "warehouse": warehouse,
                        "stock_level": levels,
                        "reorder_point": reorder_point,
                    }
                )
            )
    return pd.concat(rows, ignore_index=True)


def generate_finance(rng: np.random.Generator, sales: pd.DataFrame) -> pd.DataFrame:
    dates = pd.date_range(START_DATE, periods=N_DAYS, freq="D")
    daily_revenue = sales.groupby("date")["revenue"].sum().reindex(dates.strftime("%Y-%m-%d"), fill_value=0)

    rows = []
    for category in FINANCE_CATEGORIES:
        if category == "satis_geliri":
            amount = daily_revenue.to_numpy()
        elif category == "tedarik_gideri":
            amount = daily_revenue.to_numpy() * rng.uniform(0.35, 0.5, size=N_DAYS)
        elif category == "personel_gideri":
            amount = rng.normal(15000, 500, size=N_DAYS)
        elif category == "pazarlama_gideri":
            amount = rng.uniform(500, 5000, size=N_DAYS)
        else:
            amount = rng.uniform(100, 2000, size=N_DAYS)

        rows.append(
            pd.DataFrame(
                {
                    "date": dates.strftime("%Y-%m-%d"),
                    "category": category,
                    "amount": np.round(amount, 2),
                }
            )
        )
    return pd.concat(rows, ignore_index=True)


def inject_dirty_records(
    df: pd.DataFrame, numeric_cols: list[str], rng: np.random.Generator, fraction: float = DIRTY_FRACTION
) -> pd.DataFrame:
    """Eksik değer, aykırı değer, tip hatası ve duplikasyon enjekte eder.

    Toplam ~`fraction` oranındaki kayıt dört kirli kayıt tipine eşit
    dağıtılır; her tip birbirinden bağımsız satırları hedef alır.
    """
    df = df.copy()
    df[numeric_cols] = df[numeric_cols].astype("float64")
    n = len(df)
    per_type = max(1, int(n * fraction / 4))

    # 1) Eksik değer
    idx_missing = rng.choice(n, size=per_type, replace=False)
    col = rng.choice(numeric_cols)
    df.loc[idx_missing, col] = np.nan

    # 2) Aykırı değer (10-50x büyütme)
    idx_outlier = rng.choice(n, size=per_type, replace=False)
    col = rng.choice(numeric_cols)
    df.loc[idx_outlier, col] = df.loc[idx_outlier, col] * rng.uniform(10, 50, size=per_type)

    # 3) Tip hatası (sayısal sütuna metin sızdırma)
    idx_type_error = rng.choice(n, size=per_type, replace=False)
    col = rng.choice(numeric_cols)
    df[col] = df[col].astype(object)
    placeholders = ["bilinmiyor", "N/A", "-", "yok"]
    df.loc[idx_type_error, col] = rng.choice(placeholders, size=per_type)

    # 4) Duplikasyon
    idx_dup = rng.choice(n, size=per_type, replace=False)
    df = pd.concat([df, df.loc[idx_dup]], ignore_index=True)

    return df.sample(frac=1, random_state=int(rng.integers(0, 1_000_000))).reset_index(drop=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output-dir", type=Path, default=Path(__file__).parent.parent / "data" / "synthetic")
    args = parser.parse_args()

    rng = np.random.default_rng(args.seed)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    products = generate_products(rng)
    customers = generate_customers(rng)
    sales = generate_sales(rng, products, customers)
    inventory = generate_inventory(rng, products, sales)
    finance = generate_finance(rng, sales)

    sales_dirty = inject_dirty_records(sales, ["quantity", "unit_price", "revenue"], rng)
    inventory_dirty = inject_dirty_records(inventory, ["stock_level", "reorder_point"], rng)
    finance_dirty = inject_dirty_records(finance, ["amount"], rng)

    products.to_csv(args.output_dir / "products.csv", index=False)
    customers.to_csv(args.output_dir / "customers.csv", index=False)
    sales_dirty.to_csv(args.output_dir / "sales.csv", index=False)
    inventory_dirty.to_csv(args.output_dir / "inventory.csv", index=False)
    finance_dirty.to_csv(args.output_dir / "finance.csv", index=False)

    print(f"Çıktı dizini: {args.output_dir}")
    for name, df in [
        ("products", products),
        ("customers", customers),
        ("sales", sales_dirty),
        ("inventory", inventory_dirty),
        ("finance", finance_dirty),
    ]:
        print(f"  {name}.csv: {len(df):,} satır")


if __name__ == "__main__":
    main()
