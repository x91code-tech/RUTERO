import { getClientDocumentRequirements } from "@/lib/countries";
import type { Cashbox, Client, ClientDocument, ClientLocation, Collection, Company, Expense, Loan, Notification, Product, Route, Sale, User } from "@/lib/types";

export const demoCompany: Company = {
  id: "company_rutero_demo",
  name: "RUTERO Demo",
  rif: "J-00000000-0",
  plan: "PRO",
  countryCode: "VE",
  currencyCode: "VES",
  locale: "es-VE",
  timeZone: "America/Caracas"
};

export const demoUsers: User[] = [
  {
    id: "user_admin",
    companyId: demoCompany.id,
    name: "Admin RUTERO",
    email: "admin@rutero.app",
    role: "ADMIN"
  },
  {
    id: "user_seller",
    companyId: demoCompany.id,
    name: "Cobrador Demo",
    email: "cobrador@rutero.app",
    mobileIdentifier: "COB-DEMO",
    role: "SELLER",
    routeIds: ["route_centro"]
  },
  {
    id: "user_supervisor",
    companyId: demoCompany.id,
    name: "Supervisora Norte",
    email: "supervisor@rutero.app",
    role: "SUPERVISOR",
    routeIds: ["route_norte", "route_sur"]
  }
];

export const demoRoutes: Route[] = [
  { id: "route_centro", companyId: demoCompany.id, name: "Ruta Centro", zone: "Centro", sellerId: "user_seller", clientIds: ["client_carlos", "client_maria"] },
  { id: "route_norte", companyId: demoCompany.id, name: "Ruta Norte", zone: "Norte", sellerId: "user_supervisor", clientIds: ["client_jose", "client_ana"] },
  { id: "route_sur", companyId: demoCompany.id, name: "Ruta Sur", zone: "Sur", sellerId: "user_seller", clientIds: ["client_luis"] }
];

export const demoClients: Client[] = [
  {
    id: "client_carlos",
    companyId: demoCompany.id,
    name: "Carlos Pérez",
    phone: "+58 412-555-0101",
    address: "Av. Bolívar, local 12",
    latitude: 10.5006,
    longitude: -66.9146,
    document: "V-12345678",
    routeId: "route_centro",
    sellerId: "user_seller",
    pendingBalance: 240,
    status: "ACTIVE",
    notes: "Prefiere pagos por transferencia después de las 2 p. m."
  },
  {
    id: "client_maria",
    companyId: demoCompany.id,
    name: "María González",
    phone: "+58 414-555-0130",
    address: "Calle Comercio, esquina Sucre",
    latitude: 10.5032,
    longitude: -66.9075,
    document: "V-87654321",
    routeId: "route_centro",
    sellerId: "user_seller",
    pendingBalance: 0,
    status: "ACTIVE",
    notes: "Cliente frecuente de contado."
  },
  {
    id: "client_jose",
    companyId: demoCompany.id,
    name: "José Ramírez",
    phone: "+58 424-555-0188",
    address: "Urb. Los Pinos, casa 9",
    latitude: 10.512,
    longitude: -66.8972,
    document: "J-30200111-5",
    routeId: "route_norte",
    sellerId: "user_supervisor",
    pendingBalance: 610,
    status: "DELINQUENT",
    notes: "Revisar acuerdo de pago semanal."
  },
  {
    id: "client_ana",
    companyId: demoCompany.id,
    name: "Ana Torres",
    phone: "+58 416-555-0192",
    address: "Mercado Norte, pasillo B",
    latitude: 10.5191,
    longitude: -66.9058,
    document: "V-11223344",
    routeId: "route_norte",
    sellerId: "user_supervisor",
    pendingBalance: 120,
    status: "PENDING",
    notes: "Pendiente por confirmar pedido."
  },
  {
    id: "client_luis",
    companyId: demoCompany.id,
    name: "Luis Fernández",
    phone: "+58 412-555-0184",
    address: "Zona Industrial Sur, galpón 4",
    latitude: 10.4829,
    longitude: -66.9279,
    document: "V-44332211",
    routeId: "route_sur",
    sellerId: "user_seller",
    pendingBalance: 75,
    status: "ACTIVE",
    notes: "Solicita factura detallada."
  }
];

export const demoClientLocations: ClientLocation[] = demoClients.flatMap((client) => [
  {
    id: `${client.id}_store`,
    clientId: client.id,
    label: "Ubicación tienda",
    type: "STORE",
    address: client.address,
    latitude: client.latitude ?? 10.5,
    longitude: client.longitude ?? -66.91,
    isPrimary: true
  },
  {
    id: `${client.id}_billing`,
    clientId: client.id,
    label: "Ubicación administrativa",
    type: "BILLING",
    address: `${client.address} · oficina o punto de facturación`,
    latitude: (client.latitude ?? 10.5) + 0.0015,
    longitude: (client.longitude ?? -66.91) - 0.0015,
    isPrimary: false
  }
]);

export const demoClientDocuments: ClientDocument[] = demoClients.flatMap((client) =>
  getClientDocumentRequirements(demoCompany.countryCode).map((requirement, index) => ({
    id: `${client.id}_${requirement.type.toLowerCase()}`,
    clientId: client.id,
    countryCode: demoCompany.countryCode,
    documentType: requirement.type,
    label: requirement.label,
    required: requirement.required,
    status: index === 0 ? "UPLOADED" : requirement.required ? "PENDING" : "PENDING",
    fileUrl: index === 0 ? `/demo-documents/${client.id}-${requirement.type.toLowerCase()}.pdf` : undefined,
    notes: requirement.description
  }))
);

export const today = "2026-06-12";

export const demoSales: Sale[] = [
  { id: "sale_1", companyId: demoCompany.id, clientId: "client_carlos", sellerId: "user_seller", product: "Pedido mixto", amount: 840, paymentMethod: "CASH_USD", date: today, observation: "Entrega completa" },
  { id: "sale_2", companyId: demoCompany.id, clientId: "client_maria", sellerId: "user_seller", product: "Caja de accesorios", amount: 1200, paymentMethod: "PAGO_MOVIL", date: today },
  { id: "sale_3", companyId: demoCompany.id, clientId: "client_luis", sellerId: "user_seller", product: "Reposición de vitrina", amount: 800, paymentMethod: "BANK_TRANSFER", date: today }
];

export const demoLoans: Loan[] = [
  {
    id: "loan_carlos_1",
    companyId: demoCompany.id,
    clientId: "client_carlos",
    sellerId: "user_seller",
    principalAmount: 200,
    interestRate: 0.2,
    interestAmount: 40,
    totalAmount: 240,
    dailyPayment: 24,
    paidAmount: 0,
    balance: 240,
    termDays: 10,
    startDate: today,
    dueDate: "2026-06-21",
    status: "ACTIVE",
    notes: "Prestamo diario al 20%."
  },
  {
    id: "loan_jose_1",
    companyId: demoCompany.id,
    clientId: "client_jose",
    sellerId: "user_supervisor",
    principalAmount: 1000,
    interestRate: 0.2,
    interestAmount: 200,
    totalAmount: 1200,
    dailyPayment: 120,
    paidAmount: 590,
    balance: 610,
    termDays: 10,
    startDate: today,
    dueDate: "2026-06-21",
    status: "ACTIVE",
    notes: "Cliente con abonos parciales."
  }
];

export const demoCollections: Collection[] = [
  { id: "collection_1", companyId: demoCompany.id, clientId: "client_carlos", loanId: "loan_carlos_1", sellerId: "user_seller", amount: 24, previousBalance: 264, newBalance: 240, paymentMethod: "CASH_USD", date: today },
  { id: "collection_2", companyId: demoCompany.id, clientId: "client_ana", sellerId: "user_supervisor", amount: 320, previousBalance: 440, newBalance: 120, paymentMethod: "PAGO_MOVIL", date: today },
  { id: "collection_3", companyId: demoCompany.id, clientId: "client_jose", loanId: "loan_jose_1", sellerId: "user_supervisor", amount: 120, previousBalance: 730, newBalance: 610, paymentMethod: "BANK_TRANSFER", date: today }
];

export const demoExpenses: Expense[] = [
  { id: "expense_1", companyId: demoCompany.id, sellerId: "user_seller", type: "Gasolina", amount: 80, paymentMethod: "CASH_USD", date: today, comment: "Recarga para Ruta Centro" },
  { id: "expense_2", companyId: demoCompany.id, sellerId: "user_seller", type: "Comida", amount: 25, paymentMethod: "CASH_USD", date: today, comment: "Almuerzo operativo" },
  { id: "expense_3", companyId: demoCompany.id, sellerId: "user_supervisor", type: "Transporte", amount: 45, paymentMethod: "PAGO_MOVIL", date: today, comment: "Moto taxi para visita extra" }
];

export const demoCashbox: Cashbox = {
  id: "cashbox_today_seller",
  companyId: demoCompany.id,
  sellerId: "user_seller",
  date: today,
  initialCash: 375,
  reportedCash: 1535,
  reportedTransfer: 1200,
  reportedPix: 800,
  status: "BALANCED",
  observations: "Ruta cerrada sin diferencias."
};

export const demoProducts: Product[] = [
  { id: "product_1", companyId: demoCompany.id, name: "Combo recarga rápida", price: 35, cost: 21, stock: 64, minStock: 20, active: true },
  { id: "product_2", companyId: demoCompany.id, name: "Accesorio premium", price: 18, cost: 9, stock: 14, minStock: 15, active: true },
  { id: "product_3", companyId: demoCompany.id, name: "Kit de mostrador", price: 120, cost: 78, stock: 8, minStock: 5, active: true }
];

export const demoNotifications: Notification[] = [
  { id: "notification_1", companyId: demoCompany.id, title: "Cliente moroso", message: "José Ramírez mantiene saldo pendiente por revisar.", severity: "warning" },
  { id: "notification_2", companyId: demoCompany.id, title: "Stock bajo", message: "Accesorio premium está por debajo del mínimo.", severity: "warning" },
  { id: "notification_3", companyId: demoCompany.id, title: "Caja cuadrada", message: "Cobrador Demo cerro la caja sin diferencias.", severity: "info" }
];
