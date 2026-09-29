import { API_BASE_URL } from "./config";

export type LoginResponse = {
  ok: true;
  token: string;
  expiresAt: string;
  redirectTo: string;
};

export type ApiError = {
  ok: false;
  message: string;
};

export type MobileUser = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "SUPERVISOR" | "SELLER" | "PARTNER";
  countryCode: string;
  mobileIdentifier: string | null;
};

export type RouteClient = {
  id: string;
  name: string;
  phone: string | null;
  address: string;
  document: string | null;
  status: string;
  currencyCode: string;
  paidToday: number;
  loan: null | {
    id: string;
    totalAmount: number;
    dailyPayment: number;
    paidAmount: number;
    balance: number;
    installmentsPaid: number;
    termDays: number;
    dueDate: string;
  };
};

export type RoutePayload = {
  ok: true;
  company: {
    id: string;
    name: string;
    countryCode: string;
    currencyCode: string;
    locale: string;
    timeZone: string;
  } | null;
  sellerId: string;
  route: { id: string; name: string; zone: string } | null;
  cashbox: null | {
    id: string;
    status: string;
    initialCash: number;
    expectedCash: number;
    reportedCash: number;
    reportedTransfer: number;
    reportedPix: number;
    difference: number;
    openedAt: string;
    closedAt: string | null;
  };
  summary: {
    clients: number;
    pending: number;
    paid: number;
    expectedToday: number;
    collectedToday: number;
    outgoingToday: number;
  };
  clients: RouteClient[];
};

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.message ?? "No se pudo completar la solicitud.");
  }
  return data as T;
}

export async function loginWithEmail(input: {
  email: string;
  password: string;
  deviceToken: string;
  deviceName: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/mobile/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  return parseResponse<LoginResponse>(response);
}

export async function loginWithPin(input: {
  identifier: string;
  pin: string;
  deviceToken: string;
  deviceName: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/mobile/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, mode: "pin" })
  });
  return parseResponse<LoginResponse>(response);
}

export async function getMe(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/mobile/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return parseResponse<{ ok: true; user: MobileUser; company: unknown }>(response);
}

export async function getRoute(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/mobile/route`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return parseResponse<RoutePayload>(response);
}

export async function createCollection(token: string, input: {
  clientId: string;
  loanId?: string;
  amount: number;
  paymentType: "INSTALLMENT" | "ADVANCE" | "SETTLEMENT" | "MANUAL" | "RENEWAL" | "ADDITIONAL";
  application?: string;
  paymentMethod: string;
  observation?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/mobile/collections`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  return parseResponse<{ ok: true; collection: unknown }>(response);
}

export async function createExpense(token: string, input: {
  movementKind: "EXPENSE" | "WITHDRAWAL" | "INCOME";
  type: string;
  amount: number;
  paymentMethod: string;
  comment: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/mobile/expenses`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  return parseResponse<{ ok: true; expense: unknown }>(response);
}

export async function closeCashbox(token: string, input: {
  reportedCash: number;
  reportedTransfer: number;
  reportedPix: number;
  observations?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/mobile/cashbox/close`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  return parseResponse<{ ok: true; cashbox: unknown }>(response);
}
