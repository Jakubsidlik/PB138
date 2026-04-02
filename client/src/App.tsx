import { Menu } from 'lucide-react'

import './App.css'
import { PlannerCalendar } from './components/shared/PlannerCalendar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { plannerLegend } from './app/data'
import { usePlannerState } from './app/usePlannerState'
import type { AppScreen, UserRole } from './app/types'

const roleCopy: Record<
  UserRole,
  {
    title: string
    description: string
    actionLabel: string
    secondaryActionLabel: string
    tertiaryActionLabel: string
  }
> = {
  student: {
    title: 'Správce studijního prostoru',
    description:
      'Student upravuje předměty, vytváří lekce i události a rozhoduje, co bude veřejné nebo jen pro registrované.',
    actionLabel: 'Vytvořit předmět',
    secondaryActionLabel: 'Přidat lekci',
    tertiaryActionLabel: 'Přidat událost',
  },
  registered: {
    title: 'Registrovaný uživatel',
    description:
      'Registrovaný uživatel čte sdílený obsah, sleduje časovou osu a ukládá si veřejné předměty.',
    actionLabel: 'Sledovat předmět',
    secondaryActionLabel: 'Přidat do oblíbených',
    tertiaryActionLabel: 'Zobrazit veřejný kalendář',
  },
  public: {
    title: 'Veřejný náhled',
    description:
      'Veřejnost vidí pouze veřejně sdílené předměty, lekce a události. Všechno je read-only.',
    actionLabel: 'Veřejný náhled',
    secondaryActionLabel: 'Přehled bez editace',
    tertiaryActionLabel: 'Kalendář veřejných aktivit',
  },
}

const formatDateLabel = (value: Date) =>
  new Intl.DateTimeFormat('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(value)

const screenTone: Record<AppScreen, string> = {
  overview: 'Přehled',
  subjects: 'Předměty',
  calendar: 'Kalendář',
  users: 'Uživatelé',
}

function App() {
  const state = usePlannerState()
  const todayLabel = formatDateLabel(new Date())
  const copy = roleCopy[state.activeRole]
  const upcomingItems = state.calendarItems.slice(0, 3)

  const sidebar = (
    <div className="flex h-full flex-col gap-4">
      <Card className="border-0 bg-white/80 shadow-[0_20px_60px_rgba(31,24,18,0.12)] backdrop-blur-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              ◐
            </div>
            <div>
              <CardTitle className="text-[1.35rem]">LonelyStudent</CardTitle>
              <CardDescription>Frontend shadcn/ui, backend Express + Prisma</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-0 bg-white/80 shadow-[0_20px_60px_rgba(31,24,18,0.12)] backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Role switch</CardTitle>
          <CardDescription>Přepnutí mezi studentem, registrovaným a veřejností.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(['student', 'registered', 'public'] as const).map((role) => (
            <Button
              key={role}
              type="button"
              variant={state.activeRole === role ? 'default' : 'secondary'}
              className="w-full justify-start"
              onClick={() => state.setActiveRole(role)}
            >
              {state.roleLabels[role]}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="border-0 bg-gradient-to-br from-white/95 to-white/70 shadow-[0_20px_60px_rgba(31,24,18,0.12)] backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-lg">Dnes</CardTitle>
          <CardDescription>{todayLabel}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">{copy.title}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => state.setActiveScreen('overview')}>
              Přehled
            </Button>
            <Button type="button" variant="outline" onClick={() => state.setActiveScreen('calendar')}>
              Kalendář
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white/80 shadow-[0_20px_60px_rgba(31,24,18,0.12)] backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Co role umí</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {state.roleCapabilities[state.activeRole].map((capability) => (
            <div key={capability.label} className="space-y-1 rounded-2xl border border-border/70 bg-background/70 p-3">
              <p className="text-sm font-semibold">{capability.label}</p>
              <p className="text-sm leading-5 text-muted-foreground">{capability.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-0 bg-white/80 shadow-[0_20px_60px_rgba(31,24,18,0.12)] backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Legenda viditelnosti</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {plannerLegend.map((item) => (
            <Badge
              key={item.label}
              variant={item.tone === 'public' ? 'public' : item.tone === 'registered' ? 'registered' : 'student'}
            >
              {item.label}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className={`planner-shell role-${state.activeRole}`}>
      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] gap-4 p-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:p-6">
        <aside className="hidden lg:block">{sidebar}</aside>

        <main className="min-w-0 space-y-5">
          <header className="flex flex-col gap-4 rounded-[2rem] border border-border/70 bg-white/75 p-4 shadow-[0_20px_60px_rgba(31,24,18,0.12)] backdrop-blur-xl lg:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Studijní prostor</p>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">{screenTone[state.activeScreen]}</h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  Frontend je postavený na shadcn/ui komponentách, backend běží samostatně přes Express + Prisma.
                </p>
              </div>

              <Sheet>
                <SheetTrigger asChild>
                  <Button type="button" variant="outline" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[min(88vw,380px)] overflow-y-auto bg-background/98 p-4">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Navigace</SheetTitle>
                  </SheetHeader>
                  {sidebar}
                </SheetContent>
              </Sheet>
            </div>

            <Separator />

            <Tabs value={state.activeScreen} onValueChange={(value) => state.setActiveScreen(value as AppScreen)}>
              <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0 sm:grid-cols-4">
                {state.plannerScreens.map((screen) => (
                  <TabsTrigger
                    key={screen.id}
                    value={screen.id}
                    className="h-auto rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-left shadow-sm"
                  >
                    <span className="block text-sm font-semibold">{screen.label}</span>
                    <span className="mt-1 block text-xs font-medium text-muted-foreground">{screen.description}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </header>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <Card className="border-0 bg-white/80 shadow-[0_20px_60px_rgba(31,24,18,0.12)] backdrop-blur-xl">
              <CardHeader>
                <Badge variant={state.activeRole === 'student' ? 'student' : state.activeRole === 'registered' ? 'registered' : 'public'} className="w-fit">
                  {state.roleLabels[state.activeRole]}
                </Badge>
                <CardTitle className="text-4xl">{copy.title}</CardTitle>
                <CardDescription className="max-w-2xl text-base leading-7">{copy.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button type="button" onClick={state.canManage ? state.createSubject : undefined} disabled={!state.canManage}>
                  {state.canManage ? copy.actionLabel : 'Veřejný náhled'}
                </Button>
                <Button type="button" variant="secondary" onClick={state.canManage ? state.createLesson : undefined} disabled={!state.canManage}>
                  {copy.secondaryActionLabel}
                </Button>
                <Button type="button" variant="outline" onClick={state.canManage ? state.createEvent : undefined} disabled={!state.canManage}>
                  {copy.tertiaryActionLabel}
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="border-0 bg-white/80 shadow-[0_20px_60px_rgba(31,24,18,0.12)] backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardDescription>Viditelné předměty</CardDescription>
                  <CardTitle className="text-4xl">{state.overviewStats.sharedSubjects}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">Z nich {state.overviewStats.publicSubjects} veřejných.</CardContent>
              </Card>
              <Card className="border-0 bg-white/80 shadow-[0_20px_60px_rgba(31,24,18,0.12)] backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardDescription>Lekce v plánu</CardDescription>
                  <CardTitle className="text-4xl">{state.overviewStats.lessons}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">Časové bloky připravené do kalendáře.</CardContent>
              </Card>
              <Card className="border-0 bg-white/80 shadow-[0_20px_60px_rgba(31,24,18,0.12)] backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardDescription>Události</CardDescription>
                  <CardTitle className="text-4xl">{state.overviewStats.events}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">Deadliny, zkoušky i konzultace.</CardContent>
              </Card>
              <Card className="border-0 bg-white/80 shadow-[0_20px_60px_rgba(31,24,18,0.12)] backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardDescription>Sledované</CardDescription>
                  <CardTitle className="text-4xl">{state.overviewStats.saved}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">Pro registrované a veřejný náhled.</CardContent>
              </Card>
            </div>
          </section>

          {state.activeScreen === 'overview' ? (
            <section className="grid gap-4 xl:grid-cols-2">
              <Card className="border-0 bg-white/80 shadow-[0_20px_60px_rgba(31,24,18,0.12)] backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Prostor role</CardTitle>
                  <CardDescription>Rychlý přehled toho, co je právě viditelné.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition hover:-translate-y-px hover:shadow-md ${item.id === state.selectedItemId ? 'border-primary/30 bg-primary/5' : 'border-border/70 bg-background/70'}`}
                      onClick={() => state.setSelectedItemId(item.id)}
                    >
                      <span className={`h-3 w-3 rounded-full bg-${item.color}-500`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{item.title}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {item.subjectCode} · {item.subjectTitle}
                        </p>
                      </div>
                      <Badge variant={item.shared ? 'public' : 'outline'}>{item.shared ? 'Sdílené' : 'Soukromé'}</Badge>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-0 bg-white/80 shadow-[0_20px_60px_rgba(31,24,18,0.12)] backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Frontend vs backend</CardTitle>
                  <CardDescription>Rozdělení aplikace je viditelné i přímo v přehledu.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <Badge variant="secondary">Frontend</Badge>
                    <p className="mt-3 font-semibold">React + shadcn/ui + Tailwind</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Interaktivní obrazovky, vizuální struktura a lokální stav UI.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <Badge variant="outline">Backend</Badge>
                    <p className="mt-3 font-semibold">Express + Prisma</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      REST API, datový model, seed a role-based přístup k entitám.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          ) : null}

          {state.activeScreen === 'subjects' ? (
            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
              <Card className="border-0 bg-white/80 shadow-[0_20px_60px_rgba(31,24,18,0.12)] backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Katalog a přístup</CardTitle>
                  <CardDescription>{state.visibleSubjects.length} položek podle aktivní role.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {state.visibleSubjects.map((subject) => (
                      <Card key={subject.id} className="cursor-pointer border-border/70 bg-background/70 transition hover:-translate-y-px hover:shadow-md" onClick={() => state.setSelectedSubjectId(subject.id)}>
                        <CardHeader className="space-y-3 pb-3">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="secondary">{subject.code}</Badge>
                            <Badge variant={subject.access === 'public' ? 'public' : subject.access === 'registered' ? 'registered' : 'student'}>
                              {subject.access}
                            </Badge>
                          </div>
                          <CardTitle className="text-2xl">{subject.name}</CardTitle>
                          <CardDescription>{subject.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <span>{subject.lessonsCount} lekcí</span>
                            <span>{subject.eventsCount} událostí</span>
                            <span>{subject.studentsCount} studentů</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {state.canManage ? (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    state.toggleSubjectAccess(subject.id)
                                  }}
                                >
                                  Přepnout viditelnost
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    state.removeSubject(subject.id)
                                  }}
                                >
                                  Smazat
                                </Button>
                              </>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  state.toggleSavedSubject(subject.id)
                                }}
                              >
                                {state.savedSubjectIds.includes(subject.id) ? 'Odebrat ze sledovaných' : 'Sledovat'}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white/80 shadow-[0_20px_60px_rgba(31,24,18,0.12)] backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Detail předmětu</CardTitle>
                  <CardDescription>{state.selectedSubject?.name ?? 'Žádný předmět není vybraný.'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {state.selectedSubject ? (
                    <>
                      <Badge variant={state.selectedSubject.access === 'public' ? 'public' : state.selectedSubject.access === 'registered' ? 'registered' : 'student'} className="w-fit">
                        {state.selectedSubject.access}
                      </Badge>
                      <p className="text-sm leading-6 text-muted-foreground">{state.selectedSubject.description}</p>

                      <div className="space-y-2 rounded-2xl border border-border/70 bg-background/70 p-4">
                        <p className="text-sm font-semibold">Poslední lekce</p>
                        <div className="space-y-2">
                          {state.subjectLessons.slice(0, 2).map((lesson) => (
                            <div key={lesson.id} className="flex items-center justify-between gap-3 text-sm">
                              <span>{lesson.title}</span>
                              <span className="text-muted-foreground">{lesson.room}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 rounded-2xl border border-border/70 bg-background/70 p-4">
                        <p className="text-sm font-semibold">Události</p>
                        <div className="space-y-2">
                          {state.subjectEvents.slice(0, 2).map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                              <span>{item.title}</span>
                              <span className="text-muted-foreground">{item.kind}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {state.canManage ? (
                          <>
                            <Button type="button" onClick={state.createLesson}>Přidat lekci</Button>
                            <Button type="button" variant="secondary" onClick={state.createEvent}>Přidat událost</Button>
                          </>
                        ) : (
                          <Button type="button" variant="outline" onClick={() => state.toggleSavedSubject(state.selectedSubject!.id)}>
                            {state.savedSubjectIds.includes(state.selectedSubject.id) ? 'Odebrat sledování' : 'Sledovat předmět'}
                          </Button>
                        )}
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </section>
          ) : null}

          {state.activeScreen === 'calendar' ? (
            <PlannerCalendar
              items={state.calendarItems}
              selectedItemId={state.selectedItemId}
              onSelectItem={state.setSelectedItemId}
              activeRole={state.activeRole}
            />
          ) : null}

          {state.activeScreen === 'users' ? (
            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
              <Card className="border-0 bg-white/80 shadow-[0_20px_60px_rgba(31,24,18,0.12)] backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Uživatelé</CardTitle>
                  <CardDescription>{state.users.length} účty v systému.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {state.users.map((user) => (
                      <Card key={user.id} className="border-border/70 bg-background/70">
                        <CardHeader className="space-y-3 pb-3">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <CardTitle className="text-2xl">{user.name}</CardTitle>
                              <CardDescription>{user.email}</CardDescription>
                            </div>
                            <Badge variant={user.role === 'student' ? 'student' : user.role === 'registered' ? 'registered' : 'public'}>
                              {state.roleLabels[user.role]}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-sm leading-6 text-muted-foreground">{user.bio}</p>
                          <p className="text-sm font-semibold">{user.institution}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white/80 shadow-[0_20px_60px_rgba(31,24,18,0.12)] backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Role v systému</CardTitle>
                  <CardDescription>Rozdělení oprávnění je zřetelné mezi frontendem a backendem.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(['student', 'registered', 'public'] as const).map((role) => (
                    <div key={role} className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">{state.roleLabels[role]}</p>
                        <Badge variant={role === 'student' ? 'student' : role === 'registered' ? 'registered' : 'public'}>
                          {role}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {state.roleCapabilities[role].map((capability) => (
                          <div key={capability.label}>
                            <p className="text-sm font-medium">{capability.label}</p>
                            <p className="text-sm leading-5 text-muted-foreground">{capability.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  )
}

export default App
