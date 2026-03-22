# PB138 – Logická stavba hlavních TS/TSX souborů a chybějící logika

## 1) Logická stavba aplikace (aktuální stav)

## Vstup a kompozice
- `client/src/main.tsx`:
  - Bootstrapping React aplikace (`ReactDOM.createRoot`), mount `App`.
- `client/src/App.tsx`:
  - Hlavní orchestrátor UI.
  - Načítá stav přes `useDashboardState()`.
  - Rozvádí stav/handlery do mobilních i desktop screenů.
  - Drží jednu referenci na upload input (`fileInputRef`) sdílenou mezi Topbar + Files screeny.

## Doménový model a data vrstva (frontend)
- `client/src/app/types.ts`:
  - Definuje doménové typy: `Task`, `CalendarEvent`, `ManagedFile`, `Subject`, `UserProfile`, navigaci, témata.
- `client/src/app/data.ts`:
  - Seed data + konstanty klíčů pro localStorage.
  - Statické mapy metadat (`eventMetaSeed`, `subjectVisualByCode`, `desktopSubjectMetaByCode`).
- `client/src/app/storage.ts`:
  - Guarded čtení z `localStorage` (type-guardy pro `Task`, `CalendarEvent`, `UserProfile`).
- `client/src/app/utils.ts`:
  - Deterministické pomocné funkce: datum, build kalendáře, infer kategorie souboru, fallback meta eventu, navigace z hash.

## Stav a aplikační logika
- `client/src/app/useDashboardState.ts`:
  - **Single source of truth** pro klientský stav.
  - Hydratuje `tasks/events` z localStorage + backend (`GET /api/tasks`, `GET /api/events`).
  - Persistuje změny `tasks/events` do localStorage + backend (`PUT /api/tasks`, `PUT /api/events`).
  - Persistuje `theme/palette/profile` do localStorage.
  - Obsahuje handlery: toggle task, add/remove event, upload file, změna profilu, upload avatara, navigace.
  - Odvozuje view-modely pro UI (`selectedDayEvents`, `displayedRecentFiles`, `filteredSubjects`, `desktopSubjects`, atd.).

## Prezentační vrstva (frontend)

### Shared shell
- `client/src/components/shared/Sidebar.tsx`:
  - Navigace mezi záložkami + volba motivu (paleta, light/dark).
- `client/src/components/shared/Topbar.tsx`:
  - Kontextový mobilní header + desktop profil/search.
  - Otevírání profilu, mobilní panel motivu, upload trigger pro files.
- `client/src/components/shared/DashboardHomeContent.tsx`:
  - Dashboard agregace: progress úkolů, deadlines, dnešní rozvrh, preview souborů, předměty, checklist.

### Mobile obrazovky
- `MobileBottomNav.tsx`: hash + state navigace.
- `MobileCalendarScreen.tsx`: měsíční grid, výběr dne, list událostí dne, FAB pro přidání události.
- `MobileFilesScreen.tsx`: taby, filtry, složky, recent files, DnD/upload.
- `MobileSubjectsScreen.tsx`: vyhledávání předmětů + grid kartiček.
- `MobileProfileScreen.tsx`: edit profilu, avatar, lokální přepínače notifikací (zatím jen UI state).

### Desktop obrazovky
- `DesktopCalendarScreen.tsx`: měsíční přehled, denní panel, mazání událostí.
- `DesktopFilesScreen.tsx`: přehled složek/souborů, upload trigger.
- `DesktopSubjectsScreen.tsx`: katalog předmětů + filtry (vizuální).
- `DesktopProfileScreen.tsx`: edit profilu + avatar.

## Backend (aktuálně minimální API)
- `server/src/index.ts`:
  - Express server, CORS, JSON parser.
  - `GET /api/tasks`, `PUT /api/tasks`.
  - `GET /api/events`, `PUT /api/events`.
  - In-memory store (`tasksStore`, `eventsStore`) + seedy.
  - `subjects` endpoint je placeholder bez logické integrace na frontend.

---

## 2) Co je graficky implementováno, ale logicky chybí (GAP analýza)

## A) Předměty
UI existuje:
- vyhledávání, karty, tlačítko „+“ (`MobileSubjectsScreen`), desktop filtry + „Zapsat další předmět“ (`DesktopSubjectsScreen`).

Chybí logika:
- CRUD předmětů (create/edit/delete/archive),
- persistence předmětů na backend,
- napojení `subject.files` a `subject.notes` na reálná data (teď seed čísla).

## B) Soubory
UI existuje:
- drag&drop upload, taby (All/Recent/Shared), filtry, přehled složek/souborů.

Chybí logika:
- skutečný upload na server/cloud,
- ukládání metadat souboru (owner, subjectId, mime, path/url),
- mazání/přejmenování/sdílení souborů,
- realistický „Recent/Shared“ výpočet a stránkování.

## C) Kalendář
UI existuje:
- měsíční grid, detail dne, přidání/mazání eventu.

Chybí logika:
- robustní formulář místo `window.prompt`,
- editace událostí,
- validace kolizí termínů,
- vazba eventu na předmět,
- notifikace/připomínky.

## D) Dashboard/Home
UI existuje:
- deadliny, rozvrh, úkoly, soubory, předměty, progress.

Chybí logika:
- skutečný zdroj `schedule`,
- „See All“ akce,
- deadline priority/progress z reálných pravidel (teď index-based),
- personalizace (dnes je pevný text „Dobré ráno, Jakube!“).

## E) Profil a nastavení
UI existuje:
- edit osobních/studijních údajů, avatar, notifikační přepínače, „Uloženo automaticky“.

Chybí logika:
- backend persistence profilu,
- per-user účet (autentizace),
- ukládání notifikačních preferencí,
- validace e-mailu/limity avataru na backendu.

## F) Obecná navigace a UX akce
UI existuje:
- search input v topbaru, mnoho akčních tlačítek (⋮, download, View Study Guide, View Full Day Schedule).

Chybí logika:
- vyhledávání napříč doménami,
- menu akce (context menu),
- download endpoint,
- navigační routy na detailní stránky.

---

## 3) Návrh nových funkcí (co doplnit jako první)

## Priorita P0 (nejvyšší, aby UI odpovídalo funkčně)
1. **Subjects CRUD**
   - Frontend funkce (v `useDashboardState.ts`):
     - `createSubject(payload)`
     - `updateSubject(subjectId, patch)`
     - `deleteSubject(subjectId)`
     - `archiveSubject(subjectId)`
   - Backend API:
     - `GET/POST /api/subjects`
     - `PUT/DELETE /api/subjects/:id`

2. **Files metadata + upload workflow**
   - Frontend funkce:
     - `uploadFiles(files, subjectId?)`
     - `renameManagedFile(fileId, newName)`
     - `deleteManagedFile(fileId)`
     - `toggleFileShared(fileId, shared)`
   - Backend API:
     - `GET/POST /api/files`
     - `PATCH/DELETE /api/files/:id`
     - `POST /api/files/upload` (multipart)

3. **Calendar full CRUD + editace**
   - Frontend funkce:
     - `createEvent(payload)` (nahradit prompt)
     - `updateEvent(eventId, patch)`
     - `removeEvent(eventId)` (už existuje)
     - `validateEventConflicts(event)`
   - Backend API:
     - `GET/POST /api/events`
     - `PUT/DELETE /api/events/:id`

## Priorita P1 (stabilita a konzistence)
4. **Unified async layer + error states**
   - `loadTasks`, `saveTasks`, `loadEvents`, `saveEvents` přes jednotnou service vrstvu.
   - Zavést `isLoading`, `error`, `lastSyncedAt` pro každou doménu.

5. **Topbar global search**
   - Funkce `searchAll(query)` vracející výsledky pro `subjects/tasks/events/files`.
   - UI výsledky jako dropdown/panel.

6. **Profile backend sync**
   - API: `GET/PUT /api/profile`.
   - Funkce: `loadProfile`, `saveProfile`, `saveNotificationPrefs`.

## Priorita P2 (feature completion)
7. **Dashboard actionable widgets**
   - Napojit „See All“, „View Study Guide“, „View Full Day Schedule“.
   - Deadline scoring dle data eventu (ne dle indexu).

8. **Subjects relations**
   - Přidat `subjectId` do task/event/file.
   - Filtrovat dashboard podle zvoleného předmětu.

---

## 4) Návrh cílové service vrstvy (frontend)

Doplnit `client/src/app/services/`:
- `tasksService.ts` (`getTasks`, `saveTasks`)
- `eventsService.ts` (`getEvents`, `saveEvents`, `updateEvent`)
- `subjectsService.ts` (`getSubjects`, `createSubject`, `updateSubject`, `deleteSubject`)
- `filesService.ts` (`getFiles`, `uploadFile`, `deleteFile`, `shareFile`)
- `profileService.ts` (`getProfile`, `saveProfile`, `savePrefs`)

Výsledek:
- `useDashboardState.ts` zůstane orchestrátor stavu,
- síťová logika se oddělí do service vrstvy,
- jednodušší testování a lepší škálování.

---

## 5) Praktický implementační plán (3 sprinty)

- **Sprint 1:** Subjects CRUD + calendar editace + API validace.
- **Sprint 2:** Files upload metadata + profile sync + loading/error stavy.
- **Sprint 3:** Search, dashboard akce, vazby `subjectId` mezi entitami.
