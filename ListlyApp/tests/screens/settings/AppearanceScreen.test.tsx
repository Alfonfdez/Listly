import { describe, expect, it, beforeEach } from 'vitest';
import { render, userEvent } from '@testing-library/react-native';
import AppearanceScreen from '../../../src/screens/settings/AppearanceScreen';
import { getConfigStub, resetStub } from '../../helpers/configStub';

describe('AppearanceScreen', () => {
  beforeEach(() => resetStub());

  it('renders the theme and text size selectors with icons', async () => {
    const view = await render(<AppearanceScreen />);
    expect(view.getByText('Theme')).toBeTruthy();
    expect(view.getByText('Text size')).toBeTruthy();
    expect(view.getByText('moon')).toBeTruthy();
    expect(view.getByText('sunny')).toBeTruthy();
    expect(view.getByText('phone-portrait-outline')).toBeTruthy();
    expect(view.getAllByText('A')).toHaveLength(3);
    expect(view.getByLabelText('Dark')).toBeTruthy();
    expect(view.getByLabelText('Large')).toBeTruthy();
  });

  it('orders themes dark, light, system then sizes small, medium, large', async () => {
    const view = await render(<AppearanceScreen />);
    const labels = view.getAllByRole('button').map(button => button.props.accessibilityLabel);
    expect(labels).toEqual(['Dark', 'Light', 'System', 'Small', 'Medium', 'Large']);
  });

  it('persists the theme and text size selections', async () => {
    const user = userEvent.setup();
    const view = await render(<AppearanceScreen />);
    const updateConfig = getConfigStub().updateConfig;

    await user.press(view.getByLabelText('Dark'));
    expect(updateConfig).toHaveBeenCalledWith({ theme: 'dark' });

    await user.press(view.getByLabelText('Large'));
    expect(updateConfig).toHaveBeenCalledWith({ textSize: 'large' });
  });
});
