import { bulkEventsSchema } from './src/schemas.js';

const mockEvent = {
  id: Date.now(),
  title: "Test",
  date: "2026-05-06",
  time: undefined,
  location: undefined,
  subjectId: null,
  priority: "medium"
};

const result = bulkEventsSchema.safeParse({ events: [mockEvent] });
if (!result.success) {
  console.error(result.error);
} else {
  console.log("Validation passed!");
}
