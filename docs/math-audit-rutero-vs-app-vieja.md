# Auditoria matematica: RUTERO vs app vieja

Fecha: 2026-09-26

## Fuente revisada

- APK vieja extraida en `analysis/app-vieja-20260618-194516`.
- Resumenes revisados:
  - `payment-formula-snippets.txt`
  - `formula-words.txt`
  - `hermes-bytecode-dump.txt`
- Codigo RUTERO revisado:
  - `src/lib/cashbox-calculations.ts`
  - `src/lib/loan-payments.ts`
  - `src/lib/loan-schedule.ts`
  - `src/lib/cashbox-data.ts`
  - `src/server/actions/financial-actions.ts`

## Conceptos detectados en la app vieja

El APK no expone codigo fuente legible completo, pero el bytecode Hermes deja nombres operativos claros:

- `capital_prestado`
- `total_prestado`
- `saldo_capital`
- `saldo_interes`
- `saldo_mora`
- `valorAbono`
- `pagar_normal`
- `pagar_capital`
- `pagar_interes`
- `pagar_interes_capital`
- `pagar_mora`
- `cancelacionTotalCaja`
- `cancelacionDetalleCaja`

Tambien se observo en bytecode que el interes porcentual puede derivarse como:

```txt
((total_prestado - capital_prestado) / capital_prestado) * 100
```

En RUTERO el flujo principal usa el inverso: el usuario define capital e interes %, y el sistema calcula total.

```txt
interes = capital * tasa
total = capital + interes
cuota = total / numero_cuotas
```

Ambas formulas son equivalentes si el total final corresponde al capital mas interes.

## Formula de prestamo en RUTERO

Archivo: `src/server/actions/financial-actions.ts`

```txt
interestAmount = principalAmount * interestRate
totalAmount = principalAmount + interestAmount
dailyPayment = totalAmount / termDays
balance = totalAmount
principalBalance = principalAmount
interestBalance = interestAmount
```

Esto coincide con el flujo observado en TryController/app vieja para prestamos diarios con interes fijo.

Ejemplo:

```txt
capital = 1200
interes = 20%
total = 1440
cuotas = 20
cuota diaria = 72
```

## Formula de pago/recaudo

Archivo: `src/lib/loan-payments.ts`

RUTERO separa el pago en componentes:

```txt
mora
interes
capital
```

El orden por defecto es:

```txt
mora -> interes -> capital
```

La app vieja expone conceptos equivalentes por nombre:

```txt
pagar_mora
pagar_interes
pagar_capital
pagar_interes_capital
pagar_normal
```

RUTERO soporta esos modos con:

- `NORMAL`
- `CAPITAL_ONLY`
- `INTEREST_ONLY`
- `CAPITAL_INTEREST`
- `LATE_FEE`
- `ADDITIONAL_WITH_BALANCE`
- `ADDITIONAL_NO_BALANCE`

## Formula de caja

Archivo: `src/lib/cashbox-calculations.ts`

```txt
caja_esperada =
  caja_inicial
  + ventas_efectivo
  + recaudos_efectivo
  + entradas_efectivo
  - gastos_efectivo
  - retiros_efectivo
  - prestamos_entregados
```

Esto coincide con el comportamiento visto en la app vieja:

```txt
caja actual = caja inicial + coleccion + entradas - despesas - saques - prestamos entregados
```

Ejemplo validado:

```txt
caja inicial = 0
prestamo entregado = 1200
caja esperada = -1200

recaudo = 72
caja esperada siguiente = -1128

gasto = 50
retiro = 20
entrada = 10
caja esperada = -1188
```

## Arrastre al dia siguiente

Archivo: `src/server/actions/financial-actions.ts`

Al abrir caja nueva:

```txt
caja_inicial_hoy = efectivo_final_reportado_caja_anterior
```

Al cerrar caja:

```txt
expectedCash = formula de caja esperada
difference = reportedCash - expectedCash
```

Si el cobrador acepta el valor sugerido al cerrar, entonces:

```txt
reportedCash = expectedCash
```

Y el dia siguiente:

```txt
caja_inicial = reportedCash_anterior
```

Esto cumple el caso operativo:

```txt
inicio = -8000
recaudo = 1000
cierre = -7000
manana inicia = -7000
```

## Diferencia encontrada y corregida

En el calculo real de caja, RUTERO ya restaba `disbursedAmount`, que es lo correcto en renovaciones.

Pero el detalle visual de movimientos de caja mostraba el impacto del prestamo con `principalAmount`.

Eso generaba una diferencia visual en renovaciones:

```txt
capital nuevo = 1200
saldo viejo = 300
entregado real = 900
```

La caja debe restar `900`, no `1200`.

Correccion aplicada en:

```txt
src/lib/cashbox-data.ts
```

Ahora el detalle usa:

```txt
-(loan.disbursedAmount ?? loan.principalAmount)
```

## Estado final

La logica matematica principal de RUTERO queda alineada con la app vieja:

- Prestamo: capital + interes.
- Cuota: total / numero de cuotas.
- Recaudo: reduce saldo del prestamo y suma a caja si es efectivo.
- Pago mayor: reduce mas saldo y cubre mas cuotas proporcionalmente.
- Gasto: resta caja.
- Retiro: resta caja.
- Entrada: suma caja.
- Prestamo entregado: resta caja.
- Renovacion: resta solo lo realmente entregado.
- Cierre: guarda caja final reportada.
- Apertura siguiente: usa caja final anterior como caja inicial.

