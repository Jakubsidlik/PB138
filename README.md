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
│   │   ├── App.tsx           # Hlavní komponenta
│   │   ├── main.tsx          # Entry point
│   │   ├── index.css         # Globální styly
│   │   └── App.css
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

- [ ] Implementovat datový model (Subject, Note, Event, File)
- [ ] Vytvořit databázové schéma
- [ ] Postavit API endpointy
- [ ] Vytvořit React komponenty pro hlavní funkcionalitu
- [ ] Implementovat kalendář
- [ ] Přidat autentifikaci (volitelné)

## 📝 Poznámky

- Projekt je nastavен v monorepo struktuře s `npm workspaces`
- `concurrently` běží oba dev servery paralelně
- Frontend automaticky proxy-uje API požadavky na backend

## 👤 Autor

PB138 - Studijní plán

## 📄 Licence

ISC
