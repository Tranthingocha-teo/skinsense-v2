import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import * as history from "@/lib/history";
import { PhotoDetail } from "./photo-detail";

vi.mock("@/lib/history");
const router = { replace: vi.fn() };
vi.mock("next/navigation", () => ({ usePathname: () => "/app/photos/p1", useRouter: () => router }));

const PHOTO = {
  id: "p1",
  taken_at: new Date(new Date().getFullYear(), 8, 13, 12, 0).toISOString(),
  storage_path: "u/p1.jpg",
  spotCount: 3,
  url: "https://x/p1",
  note: "Slept late",
  tags: [{ id: "t1", label: "Thiếu ngủ" }],
  readings: [
    { zone: "forehead" as const, redness: 1.2 },
    { zone: "nose" as const, redness: 2.14 },
    { zone: "chin" as const, redness: 0.4 },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(history.loadPhotoDetail).mockResolvedValue(PHOTO);
});

function renderDetail() {
  render(
    <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
      <PhotoDetail photoId="p1" api={history} />
    </NextIntlClientProvider>,
  );
}

async function openDialog() {
  fireEvent.click(await screen.findByRole("button", { name: "Delete photo" }));
  return screen.findByRole("alertdialog", { name: "Delete this photo?" });
}

describe("PhotoDetail", () => {
  it("shows the photo's date and time, spot count, the reddest zone's reading and a link to spot marking", async () => {
    renderDetail();
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(/^Sep 13, \d\d:\d\d/);
    expect(history.loadPhotoDetail).toHaveBeenCalledWith("p1");
    expect(screen.getByText("Spots marked").nextSibling).toHaveTextContent("3");
    expect(screen.getByText("Nose · redness").nextSibling).toHaveTextContent("2.1");
    expect(screen.getByRole("link", { name: "Mark spots" })).toHaveAttribute("href", "/app/spots/p1");
    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/app/history");
  });

  it("asks before deleting, listing what goes with the photo, and cancel closes without deleting", async () => {
    renderDetail();
    const dialog = await openDialog();
    expect(dialog).toHaveTextContent("Deletes the photo, spots, readings, note and tags from the night of Sep 13. This cannot be undone.");
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(history.deletePhoto).not.toHaveBeenCalled();
  });

  it("shows progress with cancel disabled while deleting, then returns to the history", async () => {
    let finish!: () => void;
    vi.mocked(history.deletePhoto).mockReturnValue(new Promise((resolve) => (finish = resolve)));
    renderDetail();
    const dialog = await openDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete photo" }));
    expect(await within(dialog).findByRole("button", { name: "Deleting…" })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(history.deletePhoto).toHaveBeenCalledWith(PHOTO);
    finish();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/app/history"));
  });

  it("keeps the dialog open with the error when deletion fails", async () => {
    vi.mocked(history.deletePhoto).mockRejectedValue(new Error("boom"));
    renderDetail();
    const dialog = await openDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete photo" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Deletion failed. The photo is still here; try again later.");
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeEnabled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("saves an edited Note when the field loses focus, trimmed by the data module, and says so", async () => {
    vi.mocked(history.saveNote).mockResolvedValue();
    renderDetail();
    const note = await screen.findByRole("textbox", { name: "Note" });
    expect(note).toHaveValue("Slept late");
    fireEvent.blur(note);
    expect(history.saveNote).not.toHaveBeenCalled(); // unchanged
    fireEvent.change(note, { target: { value: "Slept late, new serum" } });
    fireEvent.blur(note);
    expect(history.saveNote).toHaveBeenCalledWith("p1", "Slept late, new serum");
    expect(await screen.findByRole("status")).toHaveTextContent("Saved");
  });

  it("shows an inline error and does not save a Note over 500 characters", async () => {
    renderDetail();
    const note = await screen.findByRole("textbox", { name: "Note" });
    fireEvent.change(note, { target: { value: "a".repeat(501) } });
    fireEvent.blur(note);
    expect(screen.getByRole("alert")).toHaveTextContent("Keep the note to 500 characters.");
    expect(note).toHaveAttribute("aria-invalid", "true");
    expect(history.saveNote).not.toHaveBeenCalled();
  });

  it("shows an error when the Note fails to save", async () => {
    vi.mocked(history.saveNote).mockRejectedValue(new Error("offline"));
    renderDetail();
    const note = await screen.findByRole("textbox", { name: "Note" });
    fireEvent.change(note, { target: { value: "" } });
    fireEvent.blur(note);
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't save the note. Try again later.");
  });

  it("adds a Tag with Enter and removes one from its 44px target", async () => {
    vi.mocked(history.addTag).mockResolvedValue({ id: "t2", label: "Serum mới" });
    vi.mocked(history.removeTag).mockResolvedValue();
    renderDetail();
    const tags = await screen.findByRole("group", { name: "Tags" });
    fireEvent.click(within(tags).getByRole("button", { name: "Add tag" }));
    const input = within(tags).getByRole("textbox", { name: "New tag" });
    fireEvent.change(input, { target: { value: " Serum mới " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(history.addTag).toHaveBeenCalledWith("p1", " Serum mới ");
    expect(await within(tags).findByRole("button", { name: "Remove tag Serum mới" })).toBeInTheDocument();
    expect(within(tags).getByRole("button", { name: "Add tag" })).toBeInTheDocument();

    fireEvent.click(within(tags).getByRole("button", { name: "Remove tag Thiếu ngủ" }));
    expect(history.removeTag).toHaveBeenCalledWith("t1");
    await waitFor(() => expect(within(tags).queryByText("Thiếu ngủ")).not.toBeInTheDocument());
  });

  it.each([
    ["   ", "Type a tag name."],
    ["a".repeat(25), "Keep tags to 24 characters."],
    ["thiếu NGỦ", "This photo already has that tag."],
  ])("rejects the Tag %j inline without saving", async (label, message) => {
    renderDetail();
    const tags = await screen.findByRole("group", { name: "Tags" });
    fireEvent.click(within(tags).getByRole("button", { name: "Add tag" }));
    const input = within(tags).getByRole("textbox", { name: "New tag" });
    fireEvent.change(input, { target: { value: label } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(within(tags).getByRole("alert")).toHaveTextContent(message);
    expect(history.addTag).not.toHaveBeenCalled();
  });

  it("shows an error when a Tag fails to save", async () => {
    vi.mocked(history.addTag).mockRejectedValue(new Error("offline"));
    renderDetail();
    const tags = await screen.findByRole("group", { name: "Tags" });
    fireEvent.click(within(tags).getByRole("button", { name: "Add tag" }));
    const input = within(tags).getByRole("textbox", { name: "New tag" });
    fireEvent.change(input, { target: { value: "Serum mới" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(await within(tags).findByRole("alert")).toHaveTextContent("Couldn't save the tags. Try again later.");
    expect(input).toHaveValue("Serum mới");
  });

  it("shows an error with a retry when the photo fails to load", async () => {
    vi.mocked(history.loadPhotoDetail).mockRejectedValueOnce(new Error("offline"));
    renderDetail();
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load your data");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Nose · redness")).toBeInTheDocument();
  });
});
