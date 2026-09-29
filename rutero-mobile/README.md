# RUTERO Mobile

App nativa para cobradores y supervisores. Consume el backend web existente mediante `/api/mobile/*`.

## Primer arranque

```bash
cd rutero-mobile
npm install
npm run start
```

La URL de producción está en `app.json`:

```json
"apiBaseUrl": "https://vps71519.publiccloud.com.br"
```

## Endpoints usados

- `POST /api/mobile/login`
- `GET /api/mobile/me`
- `GET /api/mobile/route`
- `POST /api/mobile/collections`
- `POST /api/mobile/expenses`
- `POST /api/mobile/cashbox/close`
