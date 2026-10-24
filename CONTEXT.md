# skinsense-v2

Skin diary app: capture a face photo with a guide, tap-mark spots, tick tonight's routine, watch per-zone trends.

## Language

**Photo**:
A single face capture: the image plus captured metadata (brightness estimate, AWB lock state). The unit a user reviews individually and compares via the before/after slider.
_Avoid_: entry, capture, image

**Zone**:
One of five fixed face regions used for tracking: forehead, left cheek, right cheek, nose, chin.
_Avoid_: region, area

**Spot**:
A user-tapped marker on a Photo, stored as normalised face-relative coordinates so it survives re-framing. Counted per Zone for the spot-count trend.
_Avoid_: marker, mark, lesion

**Note**:
Free text a user writes on one Photo to remember what was different that night: stored trimmed, at most 500 characters, at most one per Photo (an empty Note clears it). Photo history can filter to Photos that have one.
_Avoid_: comment, caption, journal entry

**Tag**:
A short user-chosen label on a Photo (e.g. "Thiếu ngủ", "Serum mới") that groups nights by cause: trimmed, 1–24 characters, unique per Photo ignoring case, deleted with its Photo. Photo history can filter by one Tag.
_Avoid_: label, category, hashtag

**ZoneReading**:
The computed `{ redness, unevenness, pixelCount }` for one Zone of one Photo (see `docs/research/redness-index.md`). Persisted at capture time, not recomputed later: the source landmarks/mask aren't retained after computing it.
_Avoid_: zone result, zone score

**RoutineItem**:
One step in a user's nightly routine checklist (e.g. "Cleanser", "Moisturizer") — user-created, -renamed, -deleted, and -reordered, not a fixed list shared across users. New users start with a small seeded default set.
_Avoid_: step, task (both ambiguous with generic to-do items outside the routine domain)

**RoutineEntry**:
One day's completion record for the user's nightly routine checklist: which RoutineItems were completed that night, stored as a snapshot of their labels at the time of ticking (not a reference to RoutineItem ids) — a later rename or delete never changes a past night's record. Independent of Photo: ticking doesn't require a photo that day.
_Avoid_: routine (ambiguous between the checklist template and a day's completion record)

**Streak**:
The number of consecutive local days, ending today — or yesterday when today has no record yet — that have a record. Two kinds: the capture streak counts days with at least one camera-sourced Photo; the routine streak counts nights whose RoutineEntry has at least one completed label.
_Avoid_: chain, run

**Reminder**:
The nightly nudge to do the routine on Android: a local wall-clock time and a set of weekdays, on or off. Stored only on that phone and delivered as local notifications scheduled on it; no schedule reaches a server, and the web app has none.
_Avoid_: alarm, push, notification (the notification is only how a Reminder is delivered)

**Demo persona**:
A named sample user behind the no-sign-in demo: a seed plus a per-Zone redness history, from which a deterministic generator builds 90 nights of Photos, ZoneReadings, Spots and RoutineEntries ending yesterday. Visitor changes to it stay in that browser (or phone) and never reach Supabase.
_Avoid_: sample account, fake user, test user
