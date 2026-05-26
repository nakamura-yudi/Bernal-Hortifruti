from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    cargas,
    company_product_prices,
    coletas,
    embalagens,
    veiculos,
    firmas,
    fretes,
    freight_rates,
    permissions,
    produtores,
    produtos,
    roles,
    services,
    tipos_manutencao,
    manutencoes,
    users,
    package_deliveries,
    package_stock,
    reports,
)

router = APIRouter()

router.include_router(auth.router)
router.include_router(company_product_prices.router)
router.include_router(users.router)
router.include_router(roles.router)
router.include_router(permissions.router)
router.include_router(produtores.router)
router.include_router(produtos.router)
router.include_router(firmas.router)
router.include_router(cargas.router)
router.include_router(veiculos.router)
router.include_router(fretes.router)
router.include_router(embalagens.router)
router.include_router(coletas.router)
router.include_router(freight_rates.router)
router.include_router(services.router)
router.include_router(tipos_manutencao.router)
router.include_router(manutencoes.router)
router.include_router(package_deliveries.router)
router.include_router(package_stock.router)
router.include_router(reports.router)
