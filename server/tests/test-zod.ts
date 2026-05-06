import { bulkEventsSchema } from './src/schemas.js';

const mockEvent = {
  id: Date.now(),
  title: "Test",
  date: "2026-05-06",
  time: "",
  location: "",
  subjectId: null,
  priority: "medium"
};

const result = bulkEventsSchema.safeParse({ events: [mockEvent] });
if (!result.success) {
  console.error(result.error);
} else {
  console.log("Validation passed!");
}

const mockEvent2 = {
  id: Date.now(),
  title: "Test",
  date: "2026-05-06",
  time: undefined,
  location: undefined,
  subjectId: null,
  priority: "medium"
};

const result2 = bulkEventsSchema.safeParse({ events: [mockEvent2] });
if (!result2.success) {
  console.error(result2.error);
} else {
  console.log("Validation 2 passed!");
}
