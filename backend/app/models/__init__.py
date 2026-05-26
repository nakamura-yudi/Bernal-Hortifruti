"""Import models here so Alembic detects them."""

from app.db.base import Base
from app.models.associations import role_permissions, user_permissions, user_roles
from app.models.company_product_price import CompanyProductPrice
from app.models.embalagem import Embalagem
from app.models.firma import Firma
from app.models.frete import FreightItem, FreightItemService, FreightPackageItem, FreightServiceRate, Frete
from app.models.carga import Carga
from app.models.veiculo import Veiculo
from app.models.tipo_manutencao import TipoManutencao
from app.models.manutencao import Manutencao
from app.models.package_stock_entry import PackageStockEntry
from app.models.package_delivery import PackageDelivery
from app.models.permission import Permission
from app.models.produto import Produto
from app.models.produtor import Produtor
from app.models.report_generation import ReportGeneration
from app.models.refresh_token_session import RefreshTokenSession
from app.models.role import Role
from app.models.service import Service
from app.models.user import User

__all__ = [
    "Base",
    "CompanyProductPrice",
    "Embalagem",
    "Firma",
    "FreightItem",
    "FreightItemService",
    "FreightPackageItem",
    "FreightServiceRate",
    "Frete",
    "Carga",
    "Veiculo",
    "TipoManutencao",
    "Manutencao",
    "PackageStockEntry",
    "Permission",
    "PackageDelivery",
    "Produto",
    "Produtor",
    "ReportGeneration",
    "RefreshTokenSession",
    "Role",
    "Service",
    "User",
    "role_permissions",
    "user_permissions",
    "user_roles",
]
