# PB138 – ERD a interakce aplikace (aktuální stav + návrhy)

## 1) ERD aktuálního stavu (data model)

```mermaid
erDiagram
  USER_PROFILE {
    string fullName
    string email
    string school
    string studyMajor
    string studyYear
    string studyType
    string avatarDataUrl
  }

  SUBJECT {
    int id
    string name
    string teacher
    string code
    int files
    int notes
  }

  TASK {
    int id
    string title
    boolean done
  }

  CALENDAR_EVENT {
    int id
    string title
    string date
  }

  EVENT_META {
    string time
    string location
    string icon
    string accent
  }

  MANAGED_FILE {
    int id
    string name
    string size
    string addedLabel
    string category
    boolean shared
  }

  FILE_FOLDER {
    int id
    string name
    int filesCount
    string color
  }

  STUDY_FILE_SEED {
    int id
    string subject
    string name
    string size
  }

  SCHEDULE_ITEM {
    int id
    string time
    string subject
    string type
    string location
  }

  APP_SETTINGS {
    string themeMode
    string accentPalette
    string activeMobileNav
    string fileTab
    string fileTypeFilter
    string subjectSearch
    string selectedDateIso
  }

  SUBJECT ||--o{ STUDY_FILE_SEED : "code -> subject"
  SUBJECT ||--o{ SCHEDULE_ITEM : "name -> subject"
  SUBJECT ||--o{ MANAGED_FILE : "logická vazba přes UI"
  CALENDAR_EVENT ||--|| EVENT_META : "event.id -> eventMetaById[event.id]"
  USER_PROFILE ||--|| APP_SETTINGS : "zobrazení/ovládání"
  APP_SETTINGS ||--o{ TASK : "filtrace + statistiky"
  APP_SETTINGS ||--o{ CALENDAR_EVENT : "výběr dne/měsíce"
  APP_SETTINGS ||--o{ MANAGED_FILE : "taby + filtry"
  APP_SETTINGS ||--o{ SUBJECT : "vyhledávání"
```

## 2) Jak mezisebou interagují záložky a funkce

```mermaid
flowchart LR
  subgraph UI[React klient]
    SIDEBAR[Sidebar + MobileBottomNav]
    TOPBAR[Topbar]
    HOME[Domů]
    CAL[Kalendář]
    SUB[Předměty]
    FIL[Soubory]
    PRO[Profil]
    STATE[useDashboardState]
  end

  subgraph STORE[Perzistence]
    LS[(localStorage)]
    API[/Express API/]
  end

  SIDEBAR -->|setActiveMobileNav + hash| STATE
  TOPBAR -->|onOpenProfile / theme / palette| STATE

  STATE --> HOME
  STATE --> CAL
  STATE --> SUB
  STATE --> FIL
  STATE --> PRO

  HOME -->|toggleTask| STATE
  CAL -->|addDesktopEvent/removeEvent/setSelectedDateIso| STATE
  SUB -->|setSubjectSearch| STATE
  FIL -->|setFileTab/setFileTypeFilter/onUploadFiles| STATE
  PRO -->|onChangeProfile/onUploadAvatar| STATE

  STATE -->|hydratace + ukládání tasks/events| LS
  STATE -->|GET/PUT tasks/events| API
  STATE -->|theme/palette/profile| LS
```

## 3) Návrhy budoucích úprav (modře)

```mermaid
flowchart TD
  A[Současný stav: seed data + localStorage + in-memory API]

  B[Databáze: PostgreSQL + Prisma]
  C[Autentizace uživatele: JWT + refresh token]
  D[Vazby mezi entitami: Subject-Task-Event-File]
  E[CRUD endpointy pro Subjects, Files, Profile]
  F[Skutečný upload souborů: S3/local disk + metadata]
  G[Notifikace termínů: cron + email/push]
  H[Sdílení materiálů mezi studenty]
  I[Audit změn a historie úkolů/událostí]
  J[Role a oprávnění: student/učitel]

  A --> B
  A --> C
  A --> D
  D --> E
  D --> F
  E --> G
  E --> H
  E --> I
  C --> J

  classDef proposal fill:#dbeafe,stroke:#2563eb,color:#1e3a8a,stroke-width:2px;
  class B,C,D,E,F,G,H,I,J proposal;
```

### Co je dnes implementováno vs. co je návrh
- **Implementováno nyní:** správa úkolů, kalendáře, souborů a profilu v klientovi; synchronizace `tasks/events` s `/api/tasks` a `/api/events`; `theme/palette/profile` v `localStorage`.
- <span style="color:#2563eb"><strong>Návrh (modře):</strong> relační DB, autentizace, plné CRUD API, reálný upload, notifikace, sdílení, historie změn a role.</span>
