# PB138 - Studijní Plán (Learning Management App)

Webová aplikace, která umožňuje studentům lépe organizovat své studium. Aplikace poskytuje funkce pro vytváření studijních položek, vedení poznámek, správu úkolů a kalendář s nadcházejícími událostmi.

## 🎯 Hlavní Funkcionality

- **Studijní položky (Subjects)** - Vytváření a správa předmětů/kurzů
- **Poznámky** - Psaní a správa poznámek pro každou položku
- **Úkoly a Termíny** - Sledování deadlinů, lekcí, cvičení
- **Kalendář** - Přehled všech nadcházejících událostí
- **Souborový systém** - Ukládání studijních materiálů a přednášek

## 🛠️ Tech Stack

### Frontend
- **React** 18.2.0
- **TypeScript** 5.3.3
- **Vite** 5.0.8
- **Port**: 5173

### Backend
- **Express.js** 4.18.2
- **TypeScript** 5.3.3
- **Node.js** runtime
- **Port**: 5000

## 📋 Struktura Projektu

```
pb138/
├── client/                    # React frontend
│   ├── src/
│   │   ├── app           
│   │   ├── components
│   │   ├── screen   
|   |   ├── App.tsx
|   |   ├── App.css       
│   │   ├── index.css         
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                    # Express backend
│   ├── src/
│   │   └── index.ts          # Server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── package.json              # Kořenový package.json (monorepo)
└── README.md
```

## 🚀 Spuštění Projektu

### Instalace závislostí
```bash
npm install
```

### Vývoj (Dev mode - běží oba servery)
```bash
npm run dev
```

Otevřete v prohlížeči:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

### Kontrola TypeScript
```bash
npm run type-check
```

### Build (produkce)
```bash
npm run build
```

### Preview produkční build
```bash
npm run preview
```

## 📁 API Endpointy (placeholder)

- `GET /api/health` - Kontrola stavu serveru
- `GET /api/subjects` - Získat všechny studijní položky
- `POST /api/subjects` - Vytvořit novou studijní položku

## 🔧 Vývoj

### Se spuštěnými servery (npm run dev)
1. Frontend automaticky hot-reloaduje změny v `client/src/`
2. Server restartuje při změnách v `server/src/`
3. API proxy v Vite přeposílá `/api/*` na `http://localhost:5000`

### Přidání nových závislostí
```bash
# Pro frontend
cd client
npm install <package>

# Pro backend
cd server
npm install <package>
```

## 📝 TODO
1. Datový model a Backend (ERD & API)
- [ ] Upravit datový model a schéma 
- [ ] Přejmenovat entitu SUBJECT na TAG (klasifikační prvek) 
- [✅] Zrušit entitu TASK_ARCHIVE a nahradit ji logikou LESSON_NOTE a LESSON_COMMENT v ERD
- [ ] Přidat do entity USER pole: datum narození, fakulta, studijní typ a rok 
- [ ] Vytvořit entitu COMMENT s vazbou na konkrétní části textu v poznámkách 
- [ ] Zajistit, aby pole v ERD (např. u Task) byla správně nastavena jako nullable 
- [ ] Postavit API endpointy (CRUD pro všechny entity) 
- [ ] Implementovat Create, Update, Delete pro Tagy, Úkoly, Plány, Lekce a Poznámky 
- [ ] Vytvořit endpointy pro správu komentářů a označování částí textu
- [ ] Implementovat systém ukládání souborů a avatarů 
- [ ] Nastavit ukládání mimo server (Amazon S3 / Blob storage) pomocí GUID jako klíče
- [ ] Propojit soubory (FILE_RECORD) přímo s entitou LESSON 

2. Autentifikace, Role a Práva
- [ ] Implementovat autentifikaci a profily
- [ ] Nastavit ukládání přihlašovacích údajů (hashovaná hesla) a session management 
- [ ] Vytvořit role a jejich oprávnění:
    - [ ] Neregistrovaný: Vidí pouze veřejná data, poznámky má "read-only"
    - [ ] Registrovaný: Plný přístup k vlastním datům a žádostem o zveřejnění 
    - [ ] Admin: Schvalování obsahu a moderování 

3. Klíčové funkce aplikace
- [ ] Organizace lekcí a předmětů: Vytvořit systém položek pro správu lekcí a studijních materiálů.
- [ ] Správa úkolů a deadlinů: Možnost zápisu termínů odevzdání (assignments) a dat cvičení/přednášek.
- [ ] Souborový systém: Implementovat úložiště pro přednášky a další studijní podklady u každé položky.
- [ ] Kalendář: Implementovat zobrazení nadcházejících událostí a deadlinů v kalendáři.
- [ ] Opakované události: Podpora pro pravidelné přednášky a cvičení.
- [ ] Vytvořit logiku sdílení
- [ ] Implementovat proces "Žádost o zveřejnění" pro poznámky a plány??? 
- [ ] Umožnit propojování entit (např. napojení vlastního předmětu na cizí studijní plán)??? 
- [ ] Kalendář a události: Implementovat kalendář s podporou opakovaných událostí 

4. Frontend a React komponenty
- [ ] Vytvořit React komponenty a UI 
- [ ] Implementovat dashboard s přehledem úkolů a pokročilým filtrováním 
- [ ] Vytvořit interaktivní textový editor pro poznámky s funkcí komentování označeného textu 
- [ ] Vytvořit komponentu pro správu profilu a nahrávání avatara 
- [ ] Postavit komponentu pro kalendář (zobrazení měsíc/týden) 

5. Finální integrace a testování
- [ ] Ověřit, že neregistrovaní uživatelé vidí pouze schválený obsah 
- [ ] Otestovat nahrávání souborů, správné generování GUID a ukládání na externí storage 
- [ ] Zkontrolovat všechna nullable pole, aby aplikace nevyhazovala chyby při chybějících datech 

## 📝 Poznámky

- Projekt je nastavен v monorepo struktuře s `npm workspaces`
- `concurrently` běží oba dev servery paralelně
- Frontend automaticky proxy-uje API požadavky na backend

## 👤 Autor

PB138 - Studijní plán

## 📄 Licence

ISC
