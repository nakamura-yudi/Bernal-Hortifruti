"""Pydantic schemas package."""

from app.schemas.permission import PermissionCreate, PermissionRead
from app.schemas.company_product_price import (
    CompanyProductPriceCreate,
    CompanyProductPriceRead,
    CompanyProductPriceUpdate,
)
from app.schemas.caminhao import CaminhaoCreate, CaminhaoRead
from app.schemas.carga import CargaCreate, CargaRead
from app.schemas.veiculo import VeiculoCreate, VeiculoRead
from app.schemas.tipo_manutencao import TipoManutencaoCreate, TipoManutencaoRead
from app.schemas.manutencao import ManutencaoCreate, ManutencaoRead
from app.schemas.package_stock import PackageStockEntryCreate, PackageStockEntryRead
from app.schemas.package_delivery import PackageDeliveryCreate, PackageDeliveryRead
from app.schemas.firma import FirmaCreate, FirmaRead
from app.schemas.freight_rate import FreightRateCreate, FreightRateRead
from app.schemas.service import ServiceCreate, ServiceRead
from app.schemas.report import (
    PaymentReportCompanyRead,
    PaymentReportRead,
    ReportGenerationDetailRead,
    ReportGenerationRead,
    UnloadingReportCompanyGroupRead,
    UnloadingReportItemRead,
    UnloadingReportRead,
)
from app.schemas.embalagem import EmbalagemCreate, EmbalagemRead
from app.schemas.produto import ProdutoCreate, ProdutoRead, ProductServicesUpdate
from app.schemas.produtor import ProdutorCreate, ProdutorRead
from app.schemas.role import RoleCreate, RoleRead
from app.schemas.user import UserCreate, UserPermissionsUpdate, UserRead, UserUpdate

__all__ = [
    "PermissionCreate",
    "PermissionRead",
    "CompanyProductPriceCreate",
    "CompanyProductPriceRead",
    "CompanyProductPriceUpdate",
    "CargaCreate",
    "CargaRead",
    "VeiculoCreate",
    "VeiculoRead",
    "TipoManutencaoCreate",
    "TipoManutencaoRead",
    "ManutencaoCreate",
    "ManutencaoRead",
    "PackageStockEntryCreate",
    "PackageStockEntryRead",
    "PackageDeliveryCreate",
    "PackageDeliveryRead",
    "FirmaCreate",
    "FirmaRead",
    "FreightRateCreate",
    "FreightRateRead",
    "ServiceCreate",
    "ServiceRead",
    "UnloadingReportItemRead",
    "UnloadingReportCompanyGroupRead",
    "UnloadingReportRead",
    "PaymentReportCompanyRead",
    "PaymentReportRead",
    "ReportGenerationDetailRead",
    "ReportGenerationRead",
    "EmbalagemCreate",
    "EmbalagemRead",
    "ProdutoCreate",
    "ProdutoRead",
    "ProductServicesUpdate",
    "ProdutorCreate",
    "ProdutorRead",
    "RoleCreate",
    "RoleRead",
    "UserCreate",
    "UserPermissionsUpdate",
    "UserRead",
    "UserUpdate",
]
