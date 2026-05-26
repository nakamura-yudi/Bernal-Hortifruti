from datetime import date, datetime

from pydantic import BaseModel


class UnloadingReportItemRead(BaseModel):
    producer_id: int
    producer_name: str
    product_id: int
    product_name: str
    package_type_id: int | None = None
    package_type_name: str
    quantity: float


class UnloadingReportCompanyGroupRead(BaseModel):
    company_id: int
    company_name: str
    items: list[UnloadingReportItemRead]


class UnloadingReportRead(BaseModel):
    carga_id: int
    load_date: date
    status: str
    created_at: datetime
    vehicle_plate: str | None = None
    driver_name: str | None = None
    companies: list[UnloadingReportCompanyGroupRead]


class PaymentReportCompanyRead(BaseModel):
    producer_id: int
    producer_name: str
    product_id: int
    product_name: str
    package_type_id: int | None = None
    package_type_name: str
    quantity: float
    total_amount: float


class PaymentReportCompanyGroupRead(BaseModel):
    company_id: int
    company_name: str
    items: list[PaymentReportCompanyRead]


class PaymentReportCargaRead(BaseModel):
    carga_id: int
    load_date: date


class PaymentReportRead(BaseModel):
    carga_ids: list[int]
    cargas: list[PaymentReportCargaRead] = []
    companies: list[PaymentReportCompanyGroupRead]


class ReportGenerationRead(BaseModel):
    id: int
    report_type: str
    parameters: dict
    created_at: datetime


class ReportGenerationDetailRead(ReportGenerationRead):
    result_data: dict
