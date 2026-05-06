# OpenAPI Specifikace - PB138 Study Planner API

## Přehled

Tento projekt nyní obsahuje úplnou **OpenAPI 3.0.0 specifikaci** (`openapi.yaml`), která slouží jako **Single Source of Truth** pro API kontrakt mezi backendem a frontendem.

## Soubory

- **`openapi.yaml`** - Kompletní OpenAPI specifikace ve YAML formátu

## Obsah specifikace

### Endpointy Tasks
- `GET /api/tasks` - Seznam úkolů s filtry a paginací
- `POST /api/tasks` - Vytvoření nového úkolu
- `PATCH /api/tasks/{id}` - Aktualizace úkolu
- `DELETE /api/tasks/{id}` - Smazání úkolu (soft delete)
- `PUT /api/tasks` - Hromadná aktualizace úkolů (bulk upsert)

### Endpointy Subjects
- `GET /api/subjects` - Seznam předmětů s filtry a paginací
- `POST /api/subjects` - Vytvoření nového předmětu
- `PUT /api/subjects/{id}` - Aktualizace předmětu
- `DELETE /api/subjects/{id}` - Smazání předmětu (soft delete s cascade)

## Klíčové rysy specifikace

### Detailní schémata
Každý endpoint obsahuje:
- ✅ Detailní popis
- ✅ Všechny query parametry s typem a popisem
- ✅ Request body schéma s validačními pravidly
- ✅ Response schémata pro všechny status kódy (200, 201, 400, 401, 403, 404)
- ✅ Příklady použití

### Bezpečnost
- 🔐 Bearer token autentizace (JWT)
- 🔐 Specifikovány autentizační požadavky na každý endpoint

### Paginace
- 📄 Podpora cursor-based paginace
- 📄 Konfigurovatelný limit (výchozí a maximální hodnoty)
- 📄 Parametry: `limit`, `cursor`, `paginated`

### Filtry
**Tasks:**
- `subjectId`, `studyPlanId`, `done`, `favorite`, `tag`, `search`, `deadlineFrom`, `deadlineTo`, `includeDeleted`

**Subjects:**
- `studyPlanId`, `includeDeleted`

### Data & Enums
- ✅ Všechny pole s typem a popisem
- ✅ Enum hodnoty: `TaskPriority` (NONE, LOW, MEDIUM, HIGH, URGENT)
- ✅ Nullable pole jasně označena
- ✅ Příklady hodnot

## Použití specifikace

### 1. Dokumentace v API klientech
Importujte `openapi.yaml` do nástrojů:
- **Swagger UI** - Interaktivní dokumentace
- **Postman** - Vytvoření kolekcí a testů
- **VS Code REST Client** - Přímé testování z editoru
- **OpenAPI Generator** - Generování SDK/klientů

### 2. Validace na backendu
Specifikace slouží jako source of truth pro:
- Request/response schémata
- Validační pravidla
- Chybové odpovědi
- Status kódy

### 3. Generování kódu
Příklady nástrojů pro generování:
```bash
# TypeScript client z OpenAPI
openapi-generator-cli generate -i openapi.yaml -g typescript-axios -o generated-client/

# TypeScript server stubs
openapi-generator-cli generate -i openapi.yaml -g nodejs-express-server -o generated-server/
```

### 4. Testování
- Specifikace obsahuje příklady požadavků a odpovědí
- Lze generovat automatické testy
- Kompatibilita se Swagger Petstore konvencí

## Struktura specifikace

```yaml
openapi: 3.0.0              # Verze specifikace
info:                       # Metadata
  title, description, version
  contact, license

servers:                    # Dostupné servery

tags:                       # Groupování endpointů

components:
  securitySchemes:         # Autentizace
  schemas:                 # Data modely a DTO

paths:                      # Všechny endpointy
  /api/{resource}:
    get:
    post:
    put:
    patch:
    delete:
```

## Příklady použití

### API client v Postmanu
1. File → Import → Link
2. Vlepte URL na `openapi.yaml`
3. Postman automaticky vytvoří kolekci s requesty
4. Přidejte Bearer token do autentizace

### Swagger UI (lokálně)
```bash
npm install -g swagger-ui-express
swagger-ui-express openapi.yaml
# Přístup na http://localhost:3000
```

### TypeScript client (Orval)
```bash
npm install -D @orval/cli

# Konfigurujte orval.config.ts
npx orval
```

## Údržba specifikace

Při změnách API:
1. ✏️ Aktualizujte `openapi.yaml`
2. ✏️ Aktualizujte backend kód
3. ✏️ Aktualizujte frontend kód
4. ✏️ Synchronizujte validační schémata

## Další informace

- **OpenAPI Docs**: https://spec.openapis.org/oas/v3.0.0
- **Editor**: https://editor.swagger.io/ (vlepte obsah openapi.yaml)
- **Validátor**: https://validator.swagger.io/

## Poznámky

- Specifikace je v Češtině, protože chybové zprávy a obecně projekt používá češtinu
- Všechny endpointy vyžadují autentizaci (Bearer token)
- Soft delete - data nejsou opravdu smazána, jen označena `deletedAt`
- Cascading delete - smazání předmětu smaže i jeho úkoly, soubory, lekce a události
