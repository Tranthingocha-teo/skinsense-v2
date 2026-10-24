import { PortalHost } from '@rn-primitives/portal';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import '@/i18n';
import * as routine from '@/lib/routine';
import { RoutineChecklist } from './routine-checklist';

// A factory, not automock: automock would load the real module and its native storage.
jest.mock('@/lib/routine', () => ({
  loadRoutine: jest.fn(),
  addItem: jest.fn(),
  renameItem: jest.fn(),
  deleteItem: jest.fn(),
  swapPositions: jest.fn(),
  saveEntry: jest.fn(),
}));
const mocked = routine as jest.Mocked<typeof routine>;

const items = ['Makeup remover', 'Cleanser', 'Acne serum', 'Moisturizer'].map((label, position) => ({
  id: `id-${position}`,
  label,
  position,
}));

async function renderChecklist() {
  await render(
    <>
      <RoutineChecklist />
      <PortalHost />
    </>,
  );
  await screen.findByText('0/4 done');
}

async function pickMenuItem(index: number, action: string) {
  await fireEvent.press(screen.getAllByLabelText(/^Options for /)[index]);
  await fireEvent.press(await screen.findByText(action));
}

const labels = () => screen.getAllByRole('checkbox').map((c) => c.props.accessibilityLabel ?? c.props['aria-label']);

beforeEach(() => {
  jest.clearAllMocks();
  mocked.loadRoutine.mockResolvedValue({ items, entry: null });
  mocked.saveEntry.mockResolvedValue();
  mocked.renameItem.mockResolvedValue();
  mocked.deleteItem.mockResolvedValue();
  mocked.swapPositions.mockResolvedValue();
  mocked.addItem.mockImplementation(async (label, position) => ({ id: `id-${position}`, label, position }));
});

describe('RoutineChecklist', () => {
  it("renders tonight's items with progress", async () => {
    await renderChecklist();
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);
    expect(mocked.loadRoutine).toHaveBeenCalledTimes(1);
    expect(mocked.loadRoutine).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), [
      'Makeup remover',
      'Cleanser',
      'Acne serum',
      'Moisturizer',
    ]);
  });

  it('ticking snapshots the ticked labels for tonight', async () => {
    await renderChecklist();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Cleanser' }));
    expect(screen.getByText('1/4 done')).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Cleanser', checked: true })).toBeTruthy();
    await waitFor(() => expect(mocked.saveEntry).toHaveBeenCalledWith(expect.any(String), ['Cleanser'], 4));
  });

  it('a failed write reloads instead of showing an error', async () => {
    await renderChecklist();
    mocked.saveEntry.mockRejectedValue(new Error('offline'));
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Cleanser' }));
    await waitFor(() => expect(mocked.loadRoutine).toHaveBeenCalledTimes(2));
    expect(screen.getByText('0/4 done')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it("renaming an item never touches tonight's entry", async () => {
    await renderChecklist();
    await pickMenuItem(1, 'Rename');
    const input = screen.getByDisplayValue('Cleanser');
    await fireEvent.changeText(input, 'Gentle cleanser');
    await fireEvent(input, 'blur');
    expect(screen.getByRole('checkbox', { name: 'Gentle cleanser' })).toBeTruthy();
    await waitFor(() => expect(mocked.renameItem).toHaveBeenCalledWith('id-1', 'Gentle cleanser'));
    expect(mocked.saveEntry).not.toHaveBeenCalled();
  });

  it('a duplicate rename shows the inline error and is not saved', async () => {
    await renderChecklist();
    await pickMenuItem(1, 'Rename');
    const input = screen.getByDisplayValue('Cleanser');
    await fireEvent.changeText(input, 'Moisturizer');
    await fireEvent(input, 'blur');
    expect(screen.getByRole('alert')).toHaveTextContent('This step already exists');
    expect(screen.getByDisplayValue('Moisturizer')).toBeTruthy();
    expect(mocked.renameItem).not.toHaveBeenCalled();
  });

  it('adds a step from the field at the end of the list', async () => {
    await renderChecklist();
    await fireEvent.press(screen.getByText('Add step'));
    const input = screen.getByLabelText('New step');
    await fireEvent.changeText(input, 'Sunscreen');
    await fireEvent(input, 'submitEditing');
    expect(labels()).toEqual([...items.map((i) => i.label), 'Sunscreen']);
    await waitFor(() => expect(mocked.addItem).toHaveBeenCalledWith('Sunscreen', 4));
    expect(screen.getByText('Add step')).toBeTruthy();
  });

  it('a duplicate new step shows the inline error and is not saved', async () => {
    await renderChecklist();
    await fireEvent.press(screen.getByText('Add step'));
    const input = screen.getByLabelText('New step');
    await fireEvent.changeText(input, 'Cleanser');
    await fireEvent(input, 'submitEditing');
    expect(screen.getByRole('alert')).toHaveTextContent('This step already exists');
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);
    expect(mocked.addItem).not.toHaveBeenCalled();
  });

  it('deletes an item from its menu', async () => {
    await renderChecklist();
    await pickMenuItem(2, 'Delete');
    expect(labels()).toEqual(['Makeup remover', 'Cleanser', 'Moisturizer']);
    await waitFor(() => expect(mocked.deleteItem).toHaveBeenCalledWith('id-2'));
  });

  it('embedded in Hôm nay: tick only, with a link to the edit screen', async () => {
    await render(<RoutineChecklist embedded />);
    await screen.findByText('0/4 done');
    expect(screen.getByText('Edit routine')).toBeTruthy();
    expect(screen.queryAllByLabelText(/^Options for /)).toHaveLength(0);
    expect(screen.queryByText('Add step')).toBeNull();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Cleanser' }));
    await waitFor(() => expect(mocked.saveEntry).toHaveBeenCalledWith(expect.any(String), ['Cleanser'], 4));
  });

  it('move down swaps positions and reorders', async () => {
    await renderChecklist();
    await pickMenuItem(0, 'Move down');
    expect(labels()).toEqual(['Cleanser', 'Makeup remover', 'Acne serum', 'Moisturizer']);
    await waitFor(() => expect(mocked.swapPositions).toHaveBeenCalledWith(items[0], items[1]));
  });
});
