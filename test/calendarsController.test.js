const test = require("node:test");
const assert = require("node:assert/strict");

const {
  listCalendarEvents,
  parseEventRange,
} = require("../controllers/calendarsController");

test("parseEventRange normalizes a valid date range", () => {
  assert.deepEqual(
    parseEventRange({
      timeMin: "2026-08-01T00:00:00-05:00",
      timeMax: "2026-09-01T00:00:00-05:00",
    }),
    {
      timeMin: "2026-08-01T05:00:00.000Z",
      timeMax: "2026-09-01T05:00:00.000Z",
    }
  );
});

test("parseEventRange rejects missing, reversed, and excessive ranges", () => {
  assert.throws(() => parseEventRange({}), { status: 400 });
  assert.throws(
    () =>
      parseEventRange({
        timeMin: "2026-09-01T00:00:00Z",
        timeMax: "2026-08-01T00:00:00Z",
      }),
    { status: 400 }
  );
  assert.throws(
    () =>
      parseEventRange({
        timeMin: "2025-01-01T00:00:00Z",
        timeMax: "2027-01-01T00:00:00Z",
      }),
    { status: 400 }
  );
});

test("listCalendarEvents follows every Google page token", async () => {
  const requests = [];
  const calendarClient = {
    events: {
      async list(request) {
        requests.push(request);
        if (!request.pageToken) {
          return {
            data: {
              items: [{ id: "first" }],
              nextPageToken: "next-page",
            },
          };
        }
        return { data: { items: [{ id: "second" }] } };
      },
    },
  };

  const events = await listCalendarEvents(
    calendarClient,
    "family/calendar@example.com",
    "2026-08-01T00:00:00.000Z",
    "2026-09-01T00:00:00.000Z"
  );

  assert.deepEqual(
    events.map((event) => event.id),
    ["first", "second"]
  );
  assert.equal(requests.length, 2);
  assert.equal(requests[0].pageToken, undefined);
  assert.equal(requests[1].pageToken, "next-page");
  assert.equal(requests[0].singleEvents, true);
  assert.equal(requests[0].orderBy, "startTime");
});
