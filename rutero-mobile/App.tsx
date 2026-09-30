import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { closeCashbox, createCollection, createExpense, getDeviceToken, getMe, getRoute, loginWithEmail, loginWithPin, type MobileUser, type RouteClient, type RoutePayload } from "./src";
import { clearSessionToken, getSessionToken, setSessionToken } from "./src/session";

type AuthMode = "email" | "pin";

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<MobileUser | null>(null);
  const [route, setRoute] = useState<RoutePayload | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (sessionToken: string) => {
    const [me, routeData] = await Promise.all([getMe(sessionToken), getRoute(sessionToken)]);
    setUser(me.user);
    setRoute(routeData);
  }, []);

  useEffect(() => {
    void (async () => {
      const stored = await getSessionToken();
      if (!stored) {
        setLoading(false);
        return;
      }
      try {
        await refresh(stored);
        setToken(stored);
      } catch {
        await clearSessionToken();
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  async function handleLoggedIn(sessionToken: string) {
    await refresh(sessionToken);
    await setSessionToken(sessionToken);
    setToken(sessionToken);
  }

  async function logout() {
    await clearSessionToken();
    setToken(null);
    setUser(null);
    setRoute(null);
  }

  if (loading) {
    return <Screen><ActivityIndicator color="#ff6a00" size="large" /></Screen>;
  }

  if (!token || !user || !route) {
    return <LoginScreen onLoggedIn={handleLoggedIn} />;
  }

  return <RouteScreen token={token} user={user} route={route} onRefresh={() => refresh(token)} onLogout={logout} />;
}

function LoginScreen({ onLoggedIn }: { onLoggedIn: (token: string) => Promise<void> }) {
  const [mode, setMode] = useState<AuthMode>("pin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const deviceToken = await getDeviceToken();
      const deviceName = "RUTERO Native";
      const result = mode === "pin"
        ? await loginWithPin({ identifier, pin, deviceToken, deviceName })
        : await loginWithEmail({ email, password, deviceToken, deviceName });
      await onLoggedIn(result.token);
    } catch (error) {
      Alert.alert("No se pudo entrar", error instanceof Error ? error.message : "Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.loginCard}>
        <Image source={require("./assets/rutero-logo.png")} style={styles.brandLogo} resizeMode="contain" accessibilityLabel="RUTERO" />
        <Text style={styles.title}>RUTERO</Text>
        <Text style={styles.subtitle}>Operacion diaria de cobro</Text>
        <View style={styles.segment}>
          <SegmentButton active={mode === "pin"} label="PIN" onPress={() => setMode("pin")} />
          <SegmentButton active={mode === "email"} label="Correo" onPress={() => setMode("email")} />
        </View>
        {mode === "pin" ? (
          <>
            <Field value={identifier} onChangeText={setIdentifier} placeholder="ID cobrador" autoCapitalize="characters" />
            <Field value={pin} onChangeText={setPin} placeholder="PIN" keyboardType="number-pad" secureTextEntry maxLength={4} />
          </>
        ) : (
          <>
            <Field value={email} onChangeText={setEmail} placeholder="Correo" autoCapitalize="none" keyboardType="email-address" />
            <Field value={password} onChangeText={setPassword} placeholder="Contrasena" secureTextEntry />
          </>
        )}
        <PrimaryButton label={loading ? "Entrando..." : "Entrar"} onPress={submit} disabled={loading} />
      </View>
      <StatusBar style="light" />
    </Screen>
  );
}

function RouteScreen({ token, user, route, onRefresh, onLogout }: {
  token: string;
  user: MobileUser;
  route: RoutePayload;
  onRefresh: () => Promise<void>;
  onLogout: () => void;
}) {
  const [busyClientId, setBusyClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<RouteClient | null>(null);
  const [movementOpen, setMovementOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const money = useMemo(() => moneyFormatter(route.company?.locale ?? "es-VE", route.company?.currencyCode ?? "VES"), [route.company]);
  const canCollect = route.cashbox?.status === "OPEN";

  async function collect(client: RouteClient, amount: number, paymentType: "INSTALLMENT" | "ADVANCE" | "SETTLEMENT" | "MANUAL") {
    if (!client.loan) return;
    if (!canCollect) {
      Alert.alert("Caja cerrada", "La caja debe estar abierta para registrar pagos.");
      return false;
    }
    setBusyClientId(client.id);
    try {
      await createCollection(token, {
        clientId: client.id,
        loanId: client.loan.id,
        amount,
        paymentType,
        application: "NORMAL",
        paymentMethod: "CASH_LOCAL"
      });
      await onRefresh();
      return true;
    } catch (error) {
      Alert.alert("No se registro", error instanceof Error ? error.message : "Revisa el pago.");
      return false;
    } finally {
      setBusyClientId(null);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      Alert.alert("No se pudo actualizar", error instanceof Error ? error.message : "Intenta nuevamente.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>{route.company?.name ?? "RUTERO"}</Text>
          <Text style={styles.title}>Ruta de cobro</Text>
          <Text style={styles.subtitle}>{user.name} - {route.route?.name ?? "Sin ruta"}</Text>
        </View>
        <Pressable style={styles.iconButton} onPress={onLogout}><Ionicons name="log-out-outline" size={22} color="#f7f2eb" /></Pressable>
      </View>

      <View style={styles.metrics}>
        <Metric label="Pendientes" value={String(route.summary.pending)} tone="orange" />
        <Metric label="Pagaron" value={String(route.summary.paid)} />
        <Metric label="Esperado" value={money(route.summary.expectedToday)} />
        <Metric label="Recaudo" value={money(route.summary.collectedToday)} tone="green" />
      </View>

      <View style={styles.cashboxStrip}>
        <Text style={styles.cashboxLabel}>Caja</Text>
        <Text style={styles.cashboxValue}>{route.cashbox ? `${route.cashbox.status} - ${money(route.cashbox.expectedCash)}` : "Sin abrir"}</Text>
        <View style={styles.quickActions}>
          <SmallAction label="Movimiento" onPress={() => setMovementOpen(true)} disabled={!canCollect} />
          {canCollect ? <SmallAction label="Cerrar caja" onPress={() => setCloseOpen(true)} /> : null}
        </View>
      </View>

      <FlatList
        data={route.clients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        renderItem={({ item }) => (
          <ClientCard
            client={item}
            money={money}
            busy={busyClientId === item.id}
            onCollect={() => collect(item, item.loan?.dailyPayment ?? 0, "INSTALLMENT")}
            onOpen={() => setSelectedClient(item)}
          />
        )}
      />
      <PaymentModal client={selectedClient} money={money} onClose={() => setSelectedClient(null)} onPay={(amount, type) => selectedClient ? collect(selectedClient, amount, type) : Promise.resolve(false)} />
      <MovementModal open={movementOpen} onClose={() => setMovementOpen(false)} onSave={async (payload) => { await createExpense(token, payload); setMovementOpen(false); await onRefresh(); }} />
      <CloseCashboxModal open={closeOpen} cashbox={route.cashbox} onClose={() => setCloseOpen(false)} onSave={async (payload) => { await closeCashbox(token, payload); setCloseOpen(false); await onRefresh(); }} />
    </SafeAreaView>
  );
}

function ClientCard({ client, money, busy, onCollect, onOpen }: {
  client: RouteClient;
  money: (value: number) => string;
  busy: boolean;
  onCollect: () => void;
  onOpen: () => void;
}) {
  const paid = client.paidToday > 0;
  return (
    <View style={[styles.clientCard, paid && styles.clientPaid]}>
      <View style={styles.clientTop}>
        <View style={styles.clientBadge}><Text style={styles.clientBadgeText}>D</Text></View>
        <View style={styles.clientNameWrap}>
          <Text style={styles.clientName} numberOfLines={1}>{client.name}</Text>
          <Text style={styles.clientAddress} numberOfLines={1}>{client.address}</Text>
        </View>
      </View>
      <View style={styles.clientGrid}>
        <Mini label="Cuota" value={client.loan ? money(client.loan.dailyPayment) : "-"} />
        <Mini label="Cuota No." value={client.loan ? `${client.loan.installmentsPaid} / ${client.loan.termDays}` : "-"} />
        <Mini label="Pago hoy" value={money(client.paidToday)} tone={paid ? "green" : "neutral"} />
        <Mini label="Saldo" value={client.loan ? money(client.loan.balance) : "-"} />
      </View>
      <View style={styles.clientActions}>
        <Pressable style={[styles.collectButton, paid && styles.collectButtonSecondary]} onPress={onCollect} disabled={busy || !client.loan}>
          <Text style={[styles.collectButtonText, paid && styles.collectButtonTextSecondary]}>{busy ? "..." : "Cuota"}</Text>
        </Pressable>
        <Pressable style={styles.moreButton} onPress={onOpen}><Text style={styles.moreButtonText}>Mas</Text></Pressable>
      </View>
    </View>
  );
}

function PaymentModal({ client, money, onClose, onPay }: {
  client: RouteClient | null;
  money: (value: number) => string;
  onClose: () => void;
  onPay: (amount: number, type: "INSTALLMENT" | "ADVANCE" | "SETTLEMENT" | "MANUAL") => Promise<boolean | undefined>;
}) {
  const [amount, setAmount] = useState("");
  if (!client?.loan) return null;
  const quota = client.loan.dailyPayment;
  const balance = client.loan.balance;
  async function pay(value: number, type: "INSTALLMENT" | "ADVANCE" | "SETTLEMENT" | "MANUAL") {
    const recorded = await onPay(value, type);
    if (!recorded) return;
    setAmount("");
    onClose();
  }
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <ModalPanel title={client.name} onClose={onClose}>
        <Text style={styles.modalMeta}>Cuota {money(quota)} · Saldo {money(balance)}</Text>
        <View style={styles.modalGrid}>
          <SmallAction label="Cuota" onPress={() => pay(quota, "INSTALLMENT")} />
          <SmallAction label="Adelanto" onPress={() => pay(quota * 2, "ADVANCE")} />
          <SmallAction label="Todo" onPress={() => pay(balance, "SETTLEMENT")} />
        </View>
        <Field value={amount} onChangeText={setAmount} placeholder="Monto manual" keyboardType="decimal-pad" />
        <PrimaryButton label="Registrar manual" onPress={() => pay(Number(amount), "MANUAL")} disabled={!Number(amount)} />
      </ModalPanel>
    </Modal>
  );
}

function MovementModal({ open, onClose, onSave }: {
  open: boolean;
  onClose: () => void;
  onSave: (payload: { movementKind: "EXPENSE" | "WITHDRAWAL" | "INCOME"; type: string; amount: number; paymentMethod: string; comment: string }) => Promise<void>;
}) {
  const [movementKind, setMovementKind] = useState<"EXPENSE" | "WITHDRAWAL" | "INCOME">("EXPENSE");
  const [type, setType] = useState("Gastos: Varios");
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    try {
      await onSave({ movementKind, type, amount: Number(amount), paymentMethod: "CASH_LOCAL", comment });
      setAmount("");
      setComment("");
    } catch (error) {
      Alert.alert("No se guardo el movimiento", error instanceof Error ? error.message : "Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <ModalPanel title="Movimiento de caja" onClose={onClose}>
        <View style={styles.segment}>
          <SegmentButton active={movementKind === "EXPENSE"} label="Gasto" onPress={() => setMovementKind("EXPENSE")} />
          <SegmentButton active={movementKind === "WITHDRAWAL"} label="Retiro" onPress={() => setMovementKind("WITHDRAWAL")} />
          <SegmentButton active={movementKind === "INCOME"} label="Entrada" onPress={() => setMovementKind("INCOME")} />
        </View>
        <Field value={type} onChangeText={setType} placeholder="Tipo" />
        <Field value={amount} onChangeText={setAmount} placeholder="Monto" keyboardType="decimal-pad" />
        <Field value={comment} onChangeText={setComment} placeholder="Comentario" />
        <PrimaryButton label={saving ? "Guardando..." : "Guardar movimiento"} onPress={save} disabled={saving || !Number(amount) || comment.length < 2} />
      </ModalPanel>
    </Modal>
  );
}

function CloseCashboxModal({ open, cashbox, onClose, onSave }: {
  open: boolean;
  cashbox: RoutePayload["cashbox"];
  onClose: () => void;
  onSave: (payload: { reportedCash: number; reportedTransfer: number; reportedPix: number; observations?: string }) => Promise<void>;
}) {
  const [reportedCash, setReportedCash] = useState(String(cashbox?.expectedCash ?? 0));
  const [reportedTransfer, setReportedTransfer] = useState(String(cashbox?.reportedTransfer ?? 0));
  const [reportedPix, setReportedPix] = useState(String(cashbox?.reportedPix ?? 0));
  const [observations, setObservations] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!open) return;
    setReportedCash(String(cashbox?.expectedCash ?? 0));
    setReportedTransfer(String(cashbox?.reportedTransfer ?? 0));
    setReportedPix(String(cashbox?.reportedPix ?? 0));
    setObservations("");
  }, [cashbox, open]);
  async function save() {
    setSaving(true);
    try {
      await onSave({ reportedCash: Number(reportedCash), reportedTransfer: Number(reportedTransfer), reportedPix: Number(reportedPix), observations });
    } catch (error) {
      Alert.alert("No se pudo cerrar la caja", error instanceof Error ? error.message : "Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <ModalPanel title="Cerrar caja" onClose={onClose}>
        <Text style={styles.modalMeta}>Esperado: {cashbox?.expectedCash ?? 0}</Text>
        <Field value={reportedCash} onChangeText={setReportedCash} placeholder="Efectivo reportado" keyboardType="decimal-pad" />
        <Field value={reportedTransfer} onChangeText={setReportedTransfer} placeholder="Transferencia reportada" keyboardType="decimal-pad" />
        <Field value={reportedPix} onChangeText={setReportedPix} placeholder="Digital reportado" keyboardType="decimal-pad" />
        <Field value={observations} onChangeText={setObservations} placeholder="Observaciones" />
        <PrimaryButton label={saving ? "Cerrando..." : "Cerrar caja"} onPress={save} disabled={saving || !cashbox || cashbox.status !== "OPEN"} />
      </ModalPanel>
    </Modal>
  );
}

function ModalPanel({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <View style={styles.modalBackdrop}>
      <ScrollView contentContainerStyle={styles.modalPanel}>
        <View style={styles.modalHeader}><Text style={styles.modalTitle}>{title}</Text><Pressable onPress={onClose}><Text style={styles.closeText}>Cerrar</Text></Pressable></View>
        {children}
      </ScrollView>
    </View>
  );
}

function Screen({ children }: { children: ReactNode }) {
  return <SafeAreaView style={styles.rootCenter}>{children}</SafeAreaView>;
}

function Field(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput {...props} placeholderTextColor="#7a746e" style={styles.input} />;
}

function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable style={[styles.primaryButton, disabled && styles.disabled]} onPress={onPress} disabled={disabled}><Text style={styles.primaryText}>{label}</Text></Pressable>;
}

function SegmentButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return <Pressable style={[styles.segmentButton, active && styles.segmentActive]} onPress={onPress}><Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text></Pressable>;
}

function Metric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "green" | "orange" }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, tone === "green" && styles.green, tone === "orange" && styles.orange]}>{value}</Text></View>;
}

function SmallAction({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable style={[styles.smallAction, disabled && styles.disabled]} onPress={onPress} disabled={disabled}><Text style={styles.smallActionText}>{label}</Text></Pressable>;
}

function Mini({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "green" }) {
  return <View style={styles.mini}><Text style={styles.miniLabel}>{label}</Text><Text style={[styles.miniValue, tone === "green" && styles.green]}>{value}</Text></View>;
}

function moneyFormatter(locale: string, currency: string) {
  return (value: number) => new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b0a09" },
  rootCenter: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0b0a09", padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingBottom: 12 },
  kicker: { color: "#ff8a2a", fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  title: { color: "#fffaf3", fontSize: 30, fontWeight: "900", letterSpacing: 0 },
  subtitle: { color: "#a8a19a", fontSize: 15, marginTop: 4 },
  iconButton: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#1b1916", borderWidth: 1, borderColor: "#302b26" },
  loginCard: { width: "100%", maxWidth: 420, borderRadius: 18, borderWidth: 1, borderColor: "#302b26", backgroundColor: "#15120f", padding: 22 },
  brandLogo: { width: 76, height: 76, marginBottom: 14 },
  segment: { flexDirection: "row", backgroundColor: "#0c0b0a", borderRadius: 14, padding: 4, marginVertical: 18 },
  segmentButton: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10 },
  segmentActive: { backgroundColor: "#ff6a00" },
  segmentText: { color: "#a8a19a", fontWeight: "800" },
  segmentTextActive: { color: "#110d09" },
  input: { minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: "#302b26", backgroundColor: "#080706", color: "#fffaf3", paddingHorizontal: 16, marginBottom: 12, fontSize: 16 },
  primaryButton: { minHeight: 56, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#ff6a00", marginTop: 6 },
  disabled: { opacity: 0.6 },
  primaryText: { color: "#110d09", fontWeight: "900", fontSize: 16 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 20 },
  metric: { width: "48%", borderRadius: 14, padding: 14, backgroundColor: "#171512", borderWidth: 1, borderColor: "#302b26" },
  metricLabel: { color: "#8e8780", fontSize: 12, fontWeight: "700" },
  metricValue: { color: "#fffaf3", fontSize: 20, fontWeight: "900", marginTop: 8 },
  green: { color: "#67e0ad" },
  orange: { color: "#ff8a2a" },
  cashboxStrip: { margin: 20, marginBottom: 8, borderRadius: 14, padding: 14, backgroundColor: "#24180f", borderWidth: 1, borderColor: "#4d2b13" },
  cashboxLabel: { color: "#ff8a2a", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  cashboxValue: { color: "#fffaf3", fontSize: 16, fontWeight: "800", marginTop: 4 },
  quickActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  smallAction: { flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#2a2723", borderWidth: 1, borderColor: "#403a34" },
  smallActionText: { color: "#fffaf3", fontWeight: "900" },
  listContent: { padding: 20, paddingTop: 8, gap: 12 },
  clientCard: { borderRadius: 16, padding: 14, backgroundColor: "#171512", borderWidth: 1, borderColor: "#302b26" },
  clientPaid: { borderLeftWidth: 5, borderLeftColor: "#67e0ad" },
  clientTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  clientBadge: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: "#ff6a00", alignItems: "center", justifyContent: "center" },
  clientBadgeText: { color: "#ff8a2a", fontWeight: "900" },
  clientNameWrap: { flex: 1 },
  clientName: { color: "#fffaf3", fontSize: 18, fontWeight: "900" },
  clientAddress: { color: "#8e8780", marginTop: 2 },
  clientGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  mini: { width: "48%", borderRadius: 12, padding: 10, backgroundColor: "#0b0a09" },
  miniLabel: { color: "#7a746e", fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  miniValue: { color: "#fffaf3", fontSize: 16, fontWeight: "900", marginTop: 5 },
  clientActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  collectButton: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#ff6a00" },
  collectButtonSecondary: { backgroundColor: "#2a2723", borderWidth: 1, borderColor: "#403a34" },
  collectButtonText: { color: "#110d09", fontWeight: "900" },
  collectButtonTextSecondary: { color: "#fffaf3" },
  moreButton: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#0b0a09", borderWidth: 1, borderColor: "#403a34" },
  moreButtonText: { color: "#fffaf3", fontWeight: "900" },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" },
  modalPanel: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, backgroundColor: "#15120f", borderWidth: 1, borderColor: "#302b26", gap: 10 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  modalTitle: { color: "#fffaf3", fontSize: 22, fontWeight: "900" },
  closeText: { color: "#ff8a2a", fontWeight: "900" },
  modalMeta: { color: "#a8a19a", marginBottom: 10 },
  modalGrid: { flexDirection: "row", gap: 8, marginBottom: 12 }
});
