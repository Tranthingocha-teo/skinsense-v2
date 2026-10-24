import { fireEvent, render, screen } from '@testing-library/react-native';
import { Share } from 'react-native';

import '@/i18n';
import { MobileShareCompare } from './share-compare';

jest.spyOn(Share, 'share').mockImplementation(() => Promise.resolve({ action: Share.sharedAction }));

describe('MobileShareCompare', () => {
  it('opens modal on press and triggers share', async () => {
    await render(
      <MobileShareCompare
        beforeDate="2026-09-01"
        afterDate="2026-09-15"
        beforeUrl="https://img/1"
        afterUrl="https://img/2"
      />
    );

    const openButton = await screen.findByRole('button', { name: 'Share' });
    expect(openButton).toBeTruthy();
    fireEvent.press(openButton);

    expect(await screen.findByText('2026-09-01 → 2026-09-15')).toBeTruthy();
    const shareButtons = screen.getAllByText('Share');
    const shareSubmit = shareButtons[shareButtons.length - 1];
    fireEvent.press(shareSubmit);

    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Share comparison',
        message: expect.stringContaining('Before (2026-09-01) vs After (2026-09-15)'),
      })
    );
  });
});
