import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

type Task = {
  id: number;
  title: string;
  done: boolean;
};

type CalendarEvent = {
  id: number;
  title: string;
  date: string;
};

const tasksSeed: Task[] = [
  { id: 1, title: 'Dokončit Data Structures essay', done: false },
  { id: 2, title: 'Přečíst materiály na AI cvičení', done: true },
  { id: 3, title: 'Nahrát zápisky z přednášky SE', done: false },
  { id: 4, title: 'Zkontrolovat termíny deadlinů', done: true },
];

const eventsSeed: CalendarEvent[] = [
  { id: 1, title: 'Data Structures Essay Deadline', date: '2026-03-18' },
  { id: 2, title: 'AI Lecture', date: '2026-03-19' },
  { id: 3, title: 'SE Exercise', date: '2026-03-20' },
];

let tasksStore: Task[] = [...tasksSeed];
let eventsStore: CalendarEvent[] = [...eventsSeed];

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server je spuštěný' });
});

// API pro studijní položky (placeholder)
app.get('/api/subjects', (req, res) => {
  res.json([]);
});

app.post('/api/subjects', (req, res) => {
  res.json({ success: true });
});

app.get('/api/tasks', (req, res) => {
  res.json(tasksStore);
});

app.put('/api/tasks', (req, res) => {
  const { tasks } = req.body as { tasks?: Task[] };

  if (!Array.isArray(tasks)) {
    res.status(400).json({ error: 'Neplatný payload: očekává se pole tasks.' });
    return;
  }

  const hasInvalidTask = tasks.some(
    (task) =>
      typeof task?.id !== 'number' ||
      typeof task?.title !== 'string' ||
      typeof task?.done !== 'boolean',
  );

  if (hasInvalidTask) {
    res.status(400).json({ error: 'Neplatná struktura tasku.' });
    return;
  }

  tasksStore = tasks;
  res.json({ success: true, tasks: tasksStore });
});

app.get('/api/events', (req, res) => {
  res.json(eventsStore);
});

app.put('/api/events', (req, res) => {
  const { events } = req.body as { events?: CalendarEvent[] };

  if (!Array.isArray(events)) {
    res.status(400).json({ error: 'Neplatný payload: očekává se pole events.' });
    return;
  }

  const hasInvalidEvent = events.some(
    (event) =>
      typeof event?.id !== 'number' ||
      typeof event?.title !== 'string' ||
      typeof event?.date !== 'string',
  );

  if (hasInvalidEvent) {
    res.status(400).json({ error: 'Neplatná struktura eventu.' });
    return;
  }

  eventsStore = events;
  res.json({ success: true, events: eventsStore });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Interní chyba serveru' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server běží na http://localhost:${PORT}`);
});
