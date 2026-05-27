from collections import defaultdict
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.dependencies import get_db, require_permissions
from app.models.carga import Carga
from app.models.frete import FreightItem, FreightPackageItem, Frete
from app.models.report_generation import ReportGeneration
from app.schemas.report import (
    PaymentReportCompanyRead,
    PaymentReportCompanyGroupRead,
    PaymentReportCargaRead,
    PaymentReportRead,
    ReportGenerationDetailRead,
    ReportGenerationRead,
    UnloadingReportCompanyGroupRead,
    UnloadingReportItemRead,
    UnloadingReportRead,
)

router = APIRouter(prefix="/reports", tags=["Reports"])


def _save_report_generation(
    db: Session,
    report_type: str,
    parameters: dict,
    result_data: dict,
) -> None:
    try:
        db.add(
            ReportGeneration(
                report_type=report_type,
                parameters=parameters,
                result_data=result_data,
            )
        )
        db.commit()
    except Exception:
        db.rollback()


@router.get("/unloading/{carga_id}", response_model=UnloadingReportRead)
def unloading_report(
    carga_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("report:view")),
) -> UnloadingReportRead:
    carga = db.scalar(select(Carga).where(Carga.id == carga_id).options(joinedload(Carga.veiculo)))
    if not carga:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carga not found")

    fretes = db.scalars(
        select(Frete)
        .where(Frete.carga_id == carga_id)
        .options(
            joinedload(Frete.company),
            joinedload(Frete.producer),
            joinedload(Frete.items).joinedload(FreightItem.product),
            joinedload(Frete.packages).joinedload(FreightPackageItem.package_type),
        )
    ).unique().all()

    grouped: dict[tuple[int, str], dict[tuple[int, str, int, str, int | None, str], Decimal]] = defaultdict(
        lambda: defaultdict(lambda: Decimal("0"))
    )

    for frete in fretes:
        company_id = frete.company_id
        company_name = frete.company.name if frete.company else f"Firma {company_id}"
        producer_id = frete.producer_id
        producer_name = frete.producer.name if frete.producer else f"Produtor {producer_id}"

        items = sorted(frete.items, key=lambda item: item.id)
        packages = sorted(frete.packages, key=lambda package: package.id)

        for idx, item in enumerate(items):
            package = packages[idx] if idx < len(packages) else None
            if package:
                package_type_id = package.package_type_id
                package_type_name = (
                    package.package_type.name if package.package_type else f"Embalagem {package_type_id}"
                )
            else:
                package_type_id = None
                package_type_name = "Nao informada"

            product_id = item.product_id
            product_name = item.product.name if item.product else f"Produto {product_id}"
            key = (producer_id, producer_name, product_id, product_name, package_type_id, package_type_name)
            grouped[(company_id, company_name)][key] += Decimal(str(item.quantity))

    companies: list[UnloadingReportCompanyGroupRead] = []
    for (company_id, company_name), items_map in sorted(grouped.items(), key=lambda entry: entry[0][1].lower()):
        report_items = [
            UnloadingReportItemRead(
                producer_id=producer_id,
                producer_name=producer_name,
                product_id=product_id,
                product_name=product_name,
                package_type_id=package_type_id,
                package_type_name=package_type_name,
                quantity=float(quantity),
            )
            for (producer_id, producer_name, product_id, product_name, package_type_id, package_type_name), quantity in sorted(
                items_map.items(),
                key=lambda entry: (entry[0][1].lower(), entry[0][3].lower(), entry[0][5].lower()),
            )
        ]
        companies.append(
            UnloadingReportCompanyGroupRead(
                company_id=company_id,
                company_name=company_name,
                items=report_items,
            )
        )

    result = UnloadingReportRead(
        carga_id=carga.id,
        load_date=carga.load_date,
        status=carga.status,
        created_at=carga.created_at,
        vehicle_plate=carga.veiculo.plate if carga.veiculo else None,
        driver_name=carga.driver_name,
        companies=companies,
    )
    _save_report_generation(
        db=db,
        report_type="unloading",
        parameters={"carga_id": carga_id},
        result_data=result.model_dump(mode="json"),
    )
    return result


@router.get("/payment", response_model=PaymentReportRead)
def payment_report(
    carga_ids: list[int] = Query(default=[]),
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("report:view")),
) -> PaymentReportRead:
    unique_ids = sorted(set(carga_ids))
    if not unique_ids:
        result = PaymentReportRead(carga_ids=[], companies=[])
        _save_report_generation(
            db=db,
            report_type="payment",
            parameters={"carga_ids": []},
            result_data=result.model_dump(mode="json"),
        )
        return result

    cargas = db.scalars(select(Carga).where(Carga.id.in_(unique_ids))).all()
    existing_carga_ids = [carga.id for carga in cargas]
    missing_ids = sorted(set(unique_ids) - set(existing_carga_ids))
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Carga not found: {missing_ids[0]}",
        )

    fretes = db.scalars(
        select(Frete)
        .where(Frete.carga_id.in_(unique_ids))
        .options(
            joinedload(Frete.company),
            joinedload(Frete.producer),
            joinedload(Frete.items).joinedload(FreightItem.product),
            joinedload(Frete.items).joinedload(FreightItem.services),
            joinedload(Frete.packages).joinedload(FreightPackageItem.package_type),
        )
    ).unique().all()

    grouped: dict[
        tuple[int, str],
        dict[tuple[int, str, int, str, int | None, str], dict[str, Decimal]],
    ] = defaultdict(
        lambda: defaultdict(lambda: {"quantity": Decimal("0"), "total_amount": Decimal("0")})
    )

    for frete in fretes:
        company_id = frete.company_id
        company_name = frete.company.name if frete.company else f"Firma {company_id}"
        producer_id = frete.producer_id
        producer_name = frete.producer.name if frete.producer else f"Produtor {producer_id}"

        items = sorted(frete.items, key=lambda item: item.id)
        packages = sorted(frete.packages, key=lambda package: package.id)
        line_entries: list[tuple[tuple[int, str, int, str, int | None, str], Decimal, Decimal]] = []

        for idx, item in enumerate(items):
            package = packages[idx] if idx < len(packages) else None
            if package:
                package_type_id = package.package_type_id
                package_type_name = (
                    package.package_type.name if package.package_type else f"Embalagem {package_type_id}"
                )
                package_total = Decimal(str(package.unit_price)) * Decimal(str(package.quantity))
            else:
                package_type_id = None
                package_type_name = "Nao informada"
                package_total = Decimal("0")

            service_total = sum(
                Decimal(str(service.unit_price)) * Decimal(str(item.quantity)) for service in item.services
            )
            item_total = (Decimal(str(item.unit_rate)) * Decimal(str(item.quantity))) + package_total + service_total

            product_id = item.product_id
            product_name = item.product.name if item.product else f"Produto {product_id}"
            key = (producer_id, producer_name, product_id, product_name, package_type_id, package_type_name)
            line_entries.append((key, Decimal(str(item.quantity)), item_total))

        line_total = sum((entry[2] for entry in line_entries), Decimal("0"))
        target_total = Decimal(str(frete.total_amount))
        factor = (target_total / line_total) if line_total > 0 else Decimal("1")

        for key, quantity, raw_total in line_entries:
            grouped[(company_id, company_name)][key]["quantity"] += quantity
            grouped[(company_id, company_name)][key]["total_amount"] += raw_total * factor

    companies = []
    for (company_id, company_name), items_map in sorted(grouped.items(), key=lambda entry: entry[0][1].lower()):
        report_items = [
            PaymentReportCompanyRead(
                producer_id=producer_id,
                producer_name=producer_name,
                product_id=product_id,
                product_name=product_name,
                package_type_id=package_type_id,
                package_type_name=package_type_name,
                quantity=float(data["quantity"]),
                total_amount=float(data["total_amount"]),
            )
            for (producer_id, producer_name, product_id, product_name, package_type_id, package_type_name), data in sorted(
                items_map.items(),
                key=lambda entry: (entry[0][1].lower(), entry[0][3].lower(), entry[0][5].lower()),
            )
        ]
        companies.append(
            PaymentReportCompanyGroupRead(
                company_id=company_id,
                company_name=company_name,
                items=report_items,
            )
        )

    carga_items = [
        PaymentReportCargaRead(carga_id=carga.id, load_date=carga.load_date)
        for carga in sorted(cargas, key=lambda item: item.load_date)
    ]

    result = PaymentReportRead(carga_ids=unique_ids, cargas=carga_items, companies=companies)
    _save_report_generation(
        db=db,
        report_type="payment",
        parameters={"carga_ids": unique_ids},
        result_data=result.model_dump(mode="json"),
    )
    return result


@router.get("/history", response_model=list[ReportGenerationRead])
def report_history(
    db: Session = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=200),
    _current_user=Depends(require_permissions("report:view")),
) -> list[ReportGenerationRead]:
    history = db.scalars(
        select(ReportGeneration).order_by(ReportGeneration.created_at.desc()).limit(limit)
    ).all()
    return [
        ReportGenerationRead(
            id=item.id,
            report_type=item.report_type,
            parameters=item.parameters,
            created_at=item.created_at,
        )
        for item in history
    ]


@router.get("/history/{report_id}", response_model=ReportGenerationDetailRead)
def report_history_detail(
    report_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("report:view")),
) -> ReportGenerationDetailRead:
    report = db.get(ReportGeneration, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relatorio not found")

    return ReportGenerationDetailRead(
        id=report.id,
        report_type=report.report_type,
        parameters=report.parameters,
        result_data=report.result_data,
        created_at=report.created_at,
    )


@router.delete("/history/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report_history(
    report_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permissions("report:delete")),
) -> None:
    report = db.get(ReportGeneration, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relatorio not found")
    db.delete(report)
    db.commit()
