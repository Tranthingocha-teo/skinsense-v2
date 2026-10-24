import { render } from '@testing-library/react-native';

import { ThemedText } from './themed-text';

describe('ThemedText', () => {
  it('renders its children', async () => {
    const { getByText } = await render(<ThemedText>hello</ThemedText>);
    expect(getByText('hello')).toBeTruthy();
  });
});
