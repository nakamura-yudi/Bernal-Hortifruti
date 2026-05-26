#!/usr/bin/env python3
"""Populate companies, producers, cargas and fretes with demo operational data."""

from __future__ import annotations

import argparse
import random
import sys
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path
from typing import TYPE_CHECKING, Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import select

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

    from app.models.carga import Carga
    from app.models.embalagem import Embalagem
    from app.models.firma import Firma
    from app.models.produto import Produto
    from app.models.produtor import Produtor
    from app.models.veiculo import Veiculo


@dataclass(frozen=True)
class SeedConfig:
    companies: int
    producers: int
    cargas: int
    fretes_per_carga: int
    seed: int


COMPANY_NAMES = [
    "Comercial Bernal",
    "Horti Vale",
    "Sacolao Paulista",
    "Distribuidora Central",
    "Mercado Horizonte",
    "Frutas Imperial",
]

PRODUCER_NAMES = [
    "Sitio Boa Esperanca",
    "Chacara Santa Luzia",
    "Fazenda Bela Vista",
    "Sitio Nova Era",
    "Chacara Ouro Verde",
    "Fazenda Primavera",
]

DRIVER_NAMES = [
    "Carlos Alberto",
    "Marcos Vinicius",
    "Paulo Henrique",
    "Rafael Augusto",
    "Joao Pedro",
    "Mateus Ferreira",
]

PRODUCT_SPECS = [
    ("Tomate", Decimal("78.00")),
    ("Batata", Decimal("52.00")),
    ("Cebola", Decimal("47.50")),
    ("Pimentao", Decimal("69.90")),
]

PACKAGE_SPECS = [
    ("Caixa plastica", Decimal("35.00")),
    ("Caixa madeira", Decimal("22.00")),
    ("Saco reforcado", Decimal("8.50")),
]

TRUCK_SPECS = [
    ("BRA2A11", "Volkswagen", "Constellation 24.280"),
    ("BRA2B22", "Mercedes-Benz", "Atego 1719"),
    ("BRA2C33", "Volvo", "VM 270"),
]


def parse_args() -> SeedConfig:
    parser = argparse.ArgumentParser(description="Populate demo operational data")
    parser.add_argument("--companies", type=int, default=4, help="Number of companies to ensure")
    parser.add_argument("--producers", type=int, default=5, help="Number of producers to ensure")
    parser.add_argument("--cargas", type=int, default=3, help="Number of cargas to create")
    parser.add_argument("--fretes-per-carga", type=int, default=4, help="Fretes to create per carga")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducible data")
    args = parser.parse_args()
    return SeedConfig(
        companies=max(1, args.companies),
        producers=max(1, args.producers),
        cargas=max(1, args.cargas),
        fretes_per_carga=max(1, args.fretes_per_carga),
        seed=args.seed,
    )


def ensure_company(session: "Session", index: int) -> "Firma":
    from app.models.firma import Firma

    document = f"10.000.000/000{index + 1:02d}-{(index + 1) % 10}"
    existing = session.scalar(select(Firma).where(Firma.document == document))
    if existing:
        return existing

    base_name = COMPANY_NAMES[index % len(COMPANY_NAMES)]
    company_name = base_name if index < len(COMPANY_NAMES) else f"{base_name} {index + 1}"
    company = Firma(
        name=company_name,
        document=document,
        state_registration=f"IE{index + 1:06d}",
        city="Sao Paulo",
        contact=f"contato{index + 1}@firma.local",
    )
    session.add(company)
    session.commit()
    session.refresh(company)
    return company


def ensure_producer(session: "Session", index: int) -> "Produtor":
    from app.models.produtor import Produtor

    document = f"20.000.000/000{index + 1:02d}-{(index + 3) % 10}"
    existing = session.scalar(select(Produtor).where(Produtor.document == document))
    if existing:
        return existing

    base_name = PRODUCER_NAMES[index % len(PRODUCER_NAMES)]
    producer_name = base_name if index < len(PRODUCER_NAMES) else f"{base_name} {index + 1}"
    producer = Produtor(
        name=producer_name,
        document=document,
        state_registration=f"PR{index + 1:06d}",
        city="Irapuru",
        contact=f"produtor{index + 1}@campo.local",
    )
    session.add(producer)
    session.commit()
    session.refresh(producer)
    return producer


def ensure_products_and_rates(session: "Session") -> list["Produto"]:
    from app.models.frete import FreightServiceRate
    from app.models.produto import Produto

    products: list[Produto] = []
    for name, rate in PRODUCT_SPECS:
        product = session.scalar(select(Produto).where(Produto.name == name))
        if not product:
            product = Produto(name=name, default_unit="caixa")
            session.add(product)
            session.commit()
            session.refresh(product)

        freight_rate = session.scalar(select(FreightServiceRate).where(FreightServiceRate.product_id == product.id))
        if not freight_rate:
            freight_rate = FreightServiceRate(product_id=product.id, rate_per_unit=float(rate))
            session.add(freight_rate)
            session.commit()
        else:
            freight_rate.rate_per_unit = float(rate)
            session.commit()

        products.append(product)

    return products


def ensure_package_types(session: "Session") -> list["Embalagem"]:
    from app.models.embalagem import Embalagem

    package_types: list[Embalagem] = []
    for name, price in PACKAGE_SPECS:
        package_type = session.scalar(select(Embalagem).where(Embalagem.name == name))
        if not package_type:
            package_type = Embalagem(name=name, unit_price=float(price))
            session.add(package_type)
            session.commit()
            session.refresh(package_type)
        else:
            package_type.unit_price = float(price)
            session.commit()
        package_types.append(package_type)
    return package_types


def ensure_trucks(session: "Session") -> list["Veiculo"]:
    from app.models.veiculo import Veiculo

    trucks: list[Veiculo] = []
    for index, (plate, brand, model) in enumerate(TRUCK_SPECS):
        truck = session.scalar(select(Veiculo).where(Veiculo.plate == plate))
        if not truck:
            truck = Veiculo(
                plate=plate,
                brand=brand,
                model=model,
                year=2020 + index,
                type="caminhao",
                current_km=25000 + (index * 5000),
                status="ativo",
                is_third_party=False,
                notes="Criado pelo seed operacional",
            )
            session.add(truck)
            session.commit()
            session.refresh(truck)
        trucks.append(truck)
    return trucks


def create_carga(session: "Session", truck: "Veiculo", driver_name: str, load_date: date) -> "Carga":
    from app.models.carga import Carga
    from app.schemas.carga import CargaCreate

    payload = CargaCreate(
        load_date=load_date,
        veiculo_id=truck.id,
        km_traveled=120,
        fuel_liters=48,
        toll_amount=36,
        diesel_amount=310,
        driver_name=driver_name,
        is_third_party=False,
        third_party_freight_value=0,
        status="aberta",
        frete_ids=[],
    )
    carga = Carga(
        load_date=payload.load_date,
        veiculo_id=payload.veiculo_id,
        km_traveled=payload.km_traveled,
        fuel_liters=payload.fuel_liters,
        toll_amount=payload.toll_amount,
        diesel_amount=payload.diesel_amount,
        driver_name=payload.driver_name,
        is_third_party=payload.is_third_party,
        third_party_freight_value=payload.third_party_freight_value,
        status=payload.status,
    )
    session.add(carga)
    session.commit()
    session.refresh(carga)
    return carga


def create_frete(
    session: "Session",
    carga: "Carga",
    producer: "Produtor",
    company: "Firma",
    products: list["Produto"],
    package_types: list["Embalagem"],
    rng: random.Random,
) -> None:
    from app.schemas.frete import FreightItemCreate, FreightPackageItemCreate, FreteCreate
    from app.services.frete_service import FreteService

    item_count = 1 if len(products) == 1 else rng.randint(1, min(2, len(products)))
    selected_products = rng.sample(products, k=item_count)

    items: list[FreightItemCreate] = []
    packages: list[FreightPackageItemCreate] = []
    for product in selected_products:
        quantity = round(rng.uniform(18, 90), 2)
        package_type = rng.choice(package_types)
        items.append(
            FreightItemCreate(
                product_id=product.id,
                quantity=quantity,
                unit="caixa",
                observation="Seed operacional",
                service_ids=[],
            )
        )
        packages.append(
            FreightPackageItemCreate(
                package_type_id=package_type.id,
                quantity=quantity,
                own_packaging=False,
            )
        )

    payload = FreteCreate(
        producer_id=producer.id,
        company_id=company.id,
        carga_id=carga.id,
        origin_city=producer.city or "Irapuru",
        destination_city=company.city or "Sao Paulo",
        own_packaging=False,
        items=items,
        packages=packages,
        total_amount=None,
    )
    FreteService(session).create_frete(payload)


def main() -> int:
    config = parse_args()
    from app.db.session import SessionLocal
    from app.models.carga import Carga

    rng = random.Random(config.seed)

    with SessionLocal() as session:
        companies = [ensure_company(session, index) for index in range(config.companies)]
        producers = [ensure_producer(session, index) for index in range(config.producers)]
        products = ensure_products_and_rates(session)
        package_types = ensure_package_types(session)
        trucks = ensure_trucks(session)

        created_cargas: list[Carga] = []
        start_date = date.today()
        for index in range(config.cargas):
            truck = trucks[index % len(trucks)]
            driver_name = DRIVER_NAMES[index % len(DRIVER_NAMES)]
            carga = create_carga(
                session=session,
                truck=truck,
                driver_name=driver_name,
                load_date=start_date - timedelta(days=index),
            )
            created_cargas.append(carga)

            for frete_index in range(config.fretes_per_carga):
                producer = producers[(index + frete_index) % len(producers)]
                company = companies[(index + frete_index) % len(companies)]
                create_frete(
                    session=session,
                    carga=carga,
                    producer=producer,
                    company=company,
                    products=products,
                    package_types=package_types,
                    rng=rng,
                )

        total_fretes = config.cargas * config.fretes_per_carga
        print("=" * 72)
        print("Seed operacional concluido")
        print("=" * 72)
        print(f"Firmas garantidas....: {len(companies)}")
        print(f"Produtores garantidos: {len(producers)}")
        print(f"Cargas criadas.......: {len(created_cargas)}")
        print(f"Fretes criados.......: {total_fretes}")
        print("=" * 72)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
