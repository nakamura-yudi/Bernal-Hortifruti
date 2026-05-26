"""Service layer implementation for frete service."""

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.company_product_price import CompanyProductPrice
from app.models.embalagem import Embalagem
from app.models.firma import Firma
from app.models.frete import (
    FreightItem,
    FreightItemService,
    FreightPackageItem,
    FreightServiceRate,
    Frete,
)
from app.models.carga import Carga
from app.models.service import Service
from app.models.produto import Produto
from app.models.produtor import Produtor
from app.schemas.frete import FreteCreate


class FreteService:
    """Freight creation with default pricing rules."""

    DEFAULT_ORIGIN = "Irapuru"
    DEFAULT_DESTINATION = "Sao Paulo"

    def __init__(self, session: Session) -> None:
        self.session = session

    def _get_product_rate(self, product_id: int) -> FreightServiceRate:
        rate = self.session.scalar(
            select(FreightServiceRate).where(FreightServiceRate.product_id == product_id)
        )
        if not rate:
            raise ValueError(f"Missing freight rate for product_id={product_id}")
        return rate

    def _resolve_unit_rate(self, producer_id: int, product_id: int, unit: str | None = None) -> Decimal:
        company_price = None
        if unit:
            company_price = self.session.scalar(
                select(CompanyProductPrice).where(
                    CompanyProductPrice.producer_id == producer_id,
                    CompanyProductPrice.product_id == product_id,
                    CompanyProductPrice.unit == unit,
                )
            )
        if company_price:
            return Decimal(str(company_price.unit_price))

        default_rate = self._get_product_rate(product_id)
        return Decimal(str(default_rate.rate_per_unit))

    def _get_package_type(self, package_type_id: int) -> Embalagem:
        package_type = self.session.get(Embalagem, package_type_id)
        if not package_type:
            raise ValueError(f"Package type not found: {package_type_id}")
        return package_type

    def _ensure_entities(self, producer_id: int, company_id: int) -> None:
        if not self.session.get(Produtor, producer_id):
            raise ValueError(f"Producer not found: {producer_id}")
        if not self.session.get(Firma, company_id):
            raise ValueError(f"Company not found: {company_id}")

    def _ensure_carga(self, carga_id: int | None) -> None:
        if carga_id is None:
            return
        if not self.session.get(Carga, carga_id):
            raise ValueError(f"Carga not found: {carga_id}")

    def create_frete(self, payload: FreteCreate) -> Frete:
        self._ensure_entities(payload.producer_id, payload.company_id)
        self._ensure_carga(payload.carga_id)

        base_total = Decimal("0")
        packaging_total = Decimal("0")
        service_total = Decimal("0")

        freight = Frete(
            carga_id=payload.carga_id,
            producer_id=payload.producer_id,
            company_id=payload.company_id,
            origin_city=payload.origin_city or self.DEFAULT_ORIGIN,
            destination_city=payload.destination_city or self.DEFAULT_DESTINATION,
            own_packaging=any(package.own_packaging for package in payload.packages),
            base_amount=0,
            packaging_amount=0,
            total_amount=0,
            discount_amount=0,
        )

        for item in payload.items:
            if not self.session.get(Produto, item.product_id):
                raise ValueError(f"Product not found: {item.product_id}")
            unit_rate = self._resolve_unit_rate(payload.producer_id, item.product_id, item.unit)
            quantity = Decimal(str(item.quantity))
            base_total += unit_rate * quantity
            freight_item = FreightItem(
                product_id=item.product_id,
                quantity=item.quantity,
                unit=item.unit,
                unit_rate=float(unit_rate),
                observation=item.observation,
            )
            if item.service_ids:
                for service_id in item.service_ids:
                    service = self.session.get(Service, service_id)
                    if not service or not service.is_active:
                        raise ValueError(f"Service not found or inactive: {service_id}")
                    unit_price = Decimal(str(service.unit_price))
                    service_total += unit_price * quantity
                    freight_item.services.append(
                        FreightItemService(service_id=service_id, unit_price=float(unit_price))
                    )
            freight.items.append(freight_item)

        for package in payload.packages:
            package_type = self._get_package_type(package.package_type_id)
            unit_price = Decimal("0") if package.own_packaging else Decimal(str(package_type.unit_price))
            quantity = Decimal(str(package.quantity))
            packaging_total += unit_price * quantity
            freight_package = FreightPackageItem(
                package_type_id=package.package_type_id,
                quantity=package.quantity,
                own_packaging=package.own_packaging,
                unit_price=float(unit_price),
            )
            freight.packages.append(freight_package)

        total_default = base_total + packaging_total + service_total
        total_amount = Decimal(str(payload.total_amount)) if payload.total_amount is not None else total_default
        discount_amount = total_default - total_amount

        freight.base_amount = float(base_total)
        freight.packaging_amount = float(packaging_total)
        freight.service_amount = float(service_total)
        freight.total_amount = float(total_amount)
        freight.discount_amount = float(discount_amount)

        self.session.add(freight)
        self.session.commit()
        self.session.refresh(freight)
        return freight

    def update_frete(self, frete_id: int, payload: FreteCreate) -> Frete:
        freight = self.session.get(Frete, frete_id)
        if not freight:
            raise ValueError(f"Frete not found: {frete_id}")

        self._ensure_entities(payload.producer_id, payload.company_id)
        self._ensure_carga(payload.carga_id)

        base_total = Decimal("0")
        packaging_total = Decimal("0")
        service_total = Decimal("0")

        freight.producer_id = payload.producer_id
        freight.company_id = payload.company_id
        freight.carga_id = payload.carga_id
        freight.origin_city = payload.origin_city or self.DEFAULT_ORIGIN
        freight.destination_city = payload.destination_city or self.DEFAULT_DESTINATION
        freight.own_packaging = any(package.own_packaging for package in payload.packages)

        freight.items.clear()
        freight.packages.clear()

        for item in payload.items:
            if not self.session.get(Produto, item.product_id):
                raise ValueError(f"Product not found: {item.product_id}")
            unit_rate = self._resolve_unit_rate(payload.producer_id, item.product_id, item.unit)
            quantity = Decimal(str(item.quantity))
            base_total += unit_rate * quantity
            freight_item = FreightItem(
                product_id=item.product_id,
                quantity=item.quantity,
                unit=item.unit,
                unit_rate=float(unit_rate),
                observation=item.observation,
            )
            if item.service_ids:
                for service_id in item.service_ids:
                    service = self.session.get(Service, service_id)
                    if not service or not service.is_active:
                        raise ValueError(f"Service not found or inactive: {service_id}")
                    unit_price = Decimal(str(service.unit_price))
                    service_total += unit_price * quantity
                    freight_item.services.append(
                        FreightItemService(service_id=service_id, unit_price=float(unit_price))
                    )
            freight.items.append(freight_item)

        for package in payload.packages:
            package_type = self._get_package_type(package.package_type_id)
            unit_price = Decimal("0") if package.own_packaging else Decimal(str(package_type.unit_price))
            quantity = Decimal(str(package.quantity))
            packaging_total += unit_price * quantity
            freight_package = FreightPackageItem(
                package_type_id=package.package_type_id,
                quantity=package.quantity,
                own_packaging=package.own_packaging,
                unit_price=float(unit_price),
            )
            freight.packages.append(freight_package)

        total_default = base_total + packaging_total + service_total
        total_amount = (
            Decimal(str(payload.total_amount)) if payload.total_amount is not None else total_default
        )
        discount_amount = total_default - total_amount

        freight.base_amount = float(base_total)
        freight.packaging_amount = float(packaging_total)
        freight.service_amount = float(service_total)
        freight.total_amount = float(total_amount)
        freight.discount_amount = float(discount_amount)

        self.session.commit()
        self.session.refresh(freight)
        return freight
