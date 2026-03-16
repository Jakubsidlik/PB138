# PB138 ERD (aktuální stav + návrhy)

## PlantUML kód (ve stylu FlowFinder)
Soubor s kódem: [pb138-erd-current-future.puml](pb138-erd-current-future.puml)

## Vygenerovaný obrázek
- PNG: [pb138-erd-current-future.png](pb138-erd-current-future.png)
- SVG: [pb138-erd-current-future.svg](pb138-erd-current-future.svg)

## Mermaid ERD (pro rychlé zobrazení ve VS Code)
```mermaid
classDiagram
  class Subject {
    +bigint id
    +string name
    +string teacher
    +string code
    +boolean archived
    +datetime createdAt
    +datetime updatedAt
  }

  class Task {
    +bigint id
    +bigint subjectId
    +string title
    +boolean done
    +datetime createdAt
    +datetime updatedAt
  }

  class Event {
    +bigint id
    +bigint subjectId
    +string title
    +datetime date
    +string time?
    +string location?
    +string icon?
    +AccentType accent?
    +datetime createdAt
    +datetime updatedAt
  }

  class FileRecord {
    +bigint id
    +bigint subjectId
    +string name
    +string size
    +string addedLabel
    +FileCategory category
    +boolean shared
    +datetime createdAt
    +datetime updatedAt
  }

  class Profile {
    +bigint id
    +string fullName
    +string email
    +string school
    +string studyMajor
    +string studyYear
    +string studyType
    +string avatarDataUrl?
    +datetime createdAt
    +datetime updatedAt
  }

  class AuditLog {
    +bigint id
    +bigint subjectId?
    +bigint entityId?
    +EntityType entityType
    +AuditAction action
    +json payload?
    +datetime createdAt
  }

  Subject "1" --> "0..*" Task : owns
  Subject "1" --> "0..*" Event : schedules
  Subject "1" --> "0..*" FileRecord : stores
  Subject "1" --> "0..*" AuditLog : hasHistory

  class StudyNoteNavrh {
    +bigint id
    +bigint subjectId
    +string title
    +text body
    +datetime createdAt
    +datetime updatedAt
  }

  class ReminderNavrh {
    +bigint id
    +bigint eventId
    +datetime remindAt
    +string channel
    +datetime sentAt?
  }

  class FileVersionNavrh {
    +bigint id
    +bigint fileId
    +int versionNo
    +string checksum
    +datetime createdAt
  }

  class SubjectMemberNavrh {
    +bigint id
    +bigint subjectId
    +bigint profileId
    +string role
    +datetime joinedAt
  }

  class SyncCheckpointNavrh {
    +bigint id
    +bigint profileId
    +string cursorEntity
    +string cursorValue
    +datetime syncedAt
  }

  Subject "1" ..> "0..*" StudyNoteNavrh : návrh
  Event "1" ..> "0..*" ReminderNavrh : návrh
  FileRecord "1" ..> "0..*" FileVersionNavrh : návrh
  Subject "1" ..> "0..*" SubjectMemberNavrh : návrh
  Profile "1" ..> "0..*" SubjectMemberNavrh : návrh
  Profile "1" ..> "0..*" SyncCheckpointNavrh : návrh

  classDef proposal fill:#dbeafe,stroke:#2563eb,color:#1e3a8a,stroke-width:2px;
  class StudyNoteNavrh proposal;
  class ReminderNavrh proposal;
  class FileVersionNavrh proposal;
  class SubjectMemberNavrh proposal;
  class SyncCheckpointNavrh proposal;
```

## Legenda
- Černé entity a vazby = současný stav projektu.
- Modré entity a vazby = doporučené rozšíření (návrh).
