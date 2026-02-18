# 🚀 Load Testing

Questa cartella contiene i test di carico per l'Admin Dashboard usando [Artillery](https://www.artillery.io/).

## 📦 Installazione

```bash
# Installa Artillery globalmente
npm install -g artillery

# Oppure usa npx
npx artillery run <test-file>
```

## 🏃 Esecuzione Test

### Smoke Test
Verifica rapida che le API rispondano correttamente:

```bash
artillery run load-tests/smoke-test.yml
```

### Load Test
Test di carico realistico con varie fasi:

```bash
artillery run load-tests/api-load-test.yml
```

### Stress Test
Trova il punto di rottura (⚠️ solo in ambiente di test):

```bash
artillery run load-tests/stress-test.yml
```

## 📊 Report

### Report HTML
```bash
artillery run load-tests/api-load-test.yml --output report.json
artillery report report.json --output report.html
```

### Report JSON per CI
```bash
artillery run load-tests/api-load-test.yml --output report.json
```

## 🎯 Endpoint Testati

| Endpoint | Peso | Descrizione |
|----------|------|-------------|
| `/api/dashboard/stats` | 30% | Statistiche dashboard |
| `/api/activity` | 40% | Feed attività real-time |
| `/api/organizations` | 25% | Lista organizzazioni |
| `/api/organizations?search=...` | 5% | Ricerca organizzazioni |

## ⚙️ Configurazione

### Fasi del Load Test

1. **Warm up** (60s @ 5 req/s) - Riscaldamento
2. **Ramp up** (120s, 5→50 req/s) - Aumento graduale
3. **Sustained load** (300s @ 50 req/s) - Carico sostenuto
4. **Spike test** (30s @ 100 req/s) - Test picco
5. **Cool down** (60s @ 5 req/s) - Raffreddamento

### Thresholds

- **p99**: < 1000ms (99° percentile)
- **maxErrorRate**: < 5%

## 🔧 Personalizzazione

### Variabili d'ambiente

```bash
# Target diverso
artillery run -t https://staging.example.com load-tests/api-load-test.yml

# Variabili custom
artillery run -v '{"token": "abc123"}' load-tests/api-load-test.yml
```

### Configurazione avanzata

Vedi [Artillery Docs](https://www.artillery.io/docs) per:
- Websocket testing
- Scenario con autenticazione
- Custom plugins
- Test con dati dinamici

## 📈 Interpretazione Risultati

### Metriche principali

- **Latency (p50/p95/p99)**: Tempo di risposta
- **RPS**: Requests per second
- **Errors**: Rate di errore
- **Scenarios**: Scenario completati/virtual users

### Esempio output

```
All VUs finished. Total time: 10 minutes, 30 seconds

--------------------------------
Summary report @ 12:00:00
--------------------------------

http.codes.200: ............................................ 15000
http.request_rate: ......................................... 50/sec
http.requests: ............................................. 15000
http.response_time:
  min: ..................................................... 45
  max: ..................................................... 850
  median: .................................................. 120
  p95: ..................................................... 350
  p99: ..................................................... 580
http.responses: ............................................ 15000
vusers.completed: .......................................... 15000
vusers.created: ............................................ 15000
```

## 🔄 CI/CD Integration

Aggiungi ai GitHub Actions:

```yaml
- name: Load Test
  run: |
    npm install -g artillery
    artillery run load-tests/smoke-test.yml
```

## 📝 Note

- I test di carico sono disabilitati in CI per default
- Esegui stress test solo in ambiente isolato
- Assicurati che il database di test sia popolato con dati realistici
