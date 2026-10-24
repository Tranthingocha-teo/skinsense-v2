import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';

// Lives outside src/app: expo-router's require.context would bundle a test there as a route.
import '@/i18n';
import TabsLayout from '@/app/(app)/(tabs)/_layout';

const stub = (label: string) => () => <Text>{label} screen</Text>;

describe('Tabs', () => {
  it.each([
    ['Capture', '/capture'],
    ['Trends', '/trends'],
    ['Settings', '/settings'],
    ['Today', '/'],
  ])('%s tab opens its screen and marks itself active', async (name, path) => {
    const router = renderRouter(
      {
        '(tabs)/_layout': TabsLayout,
        '(tabs)/index': stub('Today'),
        '(tabs)/capture': stub('Capture'),
        '(tabs)/trends': stub('Trends'),
        '(tabs)/settings': stub('Settings'),
      },
      { initialUrl: name === 'Today' ? '/trends' : '/' },
    );
    await router; // RNTL 14 renders asynchronously
    await fireEvent.press(screen.getByRole('tab', { name }));
    expect(router.getPathname()).toBe(path);
    expect(await screen.findByText(`${name} screen`)).toBeTruthy();
    expect(screen.getByRole('tab', { name })).toBeSelected();
  });
});
