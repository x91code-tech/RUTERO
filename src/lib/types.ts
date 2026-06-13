export type Role = "SUPER_ADMIN" | "ADMIN" | "SUPERVISOR" | "SELLER";
export type PaymentMethod =
  | "CASH"
  | "TRANSFER"
  | "PIX"
  | "CREDIT"
  | "MIXED"
  | "CASH_LOCAL"
  | "CASH_USD"
  | "PAGO_MOVIL"
  | "BANK_TRANSFER"
  | "CARD"
  | "PSE"
  | "NEQUI"
  | "DAVIPLATA"
  | "SPEI"
  | "OXXO"
  | "ACH"
  | "YAPPY"
  | "YAPE"
  | "PLIN"
  | "MERCADO_PAGO";
export type ClientStatus = "ACTIVE" | "PENDING" | "DELINQUENT" | "INACTIVE";
export type VisitStatus = "PENDING" | "VISITED" | "NOT_FOUND" | "COLLECTED" | "SALE_DONE";
export type CashboxStatus = "OPEN" | "CLOSED" | "BALANCED" | "UNBALANCED" | "REQUIRES_REVIEW";
export type ClientLocationType = "STORE" | "WAREHOUSE" | "BILLING" | "OTHER";
export type ClientDocumentStatus = "PENDING" | "UPLOADED" | "APPROVED" | "REJECTED";

export type Company = {
  id: string;
  name: string;
  rif?: string;
  plan: string;
  countryCode: string;
  currencyCode: string;
  locale: string;
  timeZone: string;
  fractionDigits?: number;
};

export type User = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: Role;
  routeIds?: string[];
};

export type Client = {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  document: string;
  routeId: string;
  sellerId: string;
  pendingBalance: number;
  status: ClientStatus;
  notes: string;
  locations?: ClientLocation[];
  documents?: ClientDocument[];
};

export type ClientLocation = {
  id: string;
  clientId: string;
  label: string;
  type: ClientLocationType;
  address: string;
  latitude: number;
  longitude: number;
  isPrimary: boolean;
};

export type ClientDocument = {
  id: string;
  clientId: string;
  countryCode: string;
  documentType: string;
  label: string;
  required: boolean;
  status: ClientDocumentStatus;
  fileUrl?: string;
  notes?: string;
};

export type Route = {
  id: string;
  companyId: string;
  name: string;
  zone: string;
  sellerId: string;
  clientIds: string[];
};

export type Sale = {
  id: string;
  companyId: string;
  clientId: string;
  sellerId: string;
  product: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  observation?: string;
};

export type Collection = {
  id: string;
  companyId: string;
  clientId: string;
  sellerId: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
  paymentMethod: PaymentMethod;
  date: string;
  observation?: string;
};

export type Expense = {
  id: string;
  companyId: string;
  sellerId: string;
  type: "Gasolina" | "Comida" | "Transporte" | "Material" | "Otro";
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  comment: string;
};

export type Cashbox = {
  id: string;
  companyId: string;
  sellerId: string;
  date: string;
  initialCash: number;
  reportedCash: number;
  reportedTransfer: number;
  reportedPix: number;
  status: CashboxStatus;
  observations: string;
};

export type Product = {
  id: string;
  companyId: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  active: boolean;
};

export type Notification = {
  id: string;
  companyId: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
};
