import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, userEvent } from '@testing-library/react-native';
import SettingsScreen from '../../src/screens/SettingsScreen';
import { resetStub, setConfig } from '../helpers/configStub';

const nav = { navigate: vi.fn() };

vi.mock('@react-navigation/native', () => ({
  useNavigation: () => nav,
}));

describe('SettingsScreen', () => {
  beforeEach(() => resetStub());

  it('renders the four settings entries and navigates to each sub-screen', async () => {
    const user = userEvent.setup();
    const view = await render(<SettingsScreen />);

    expect(view.getByText('Appearance')).toBeTruthy();
    expect(view.getByText('Regional')).toBeTruthy();
    expect(view.getByText('Personalization')).toBeTruthy();
    expect(view.getByText('Data')).toBeTruthy();

    await user.press(view.getByLabelText('Appearance'));
    expect(nav.navigate).toHaveBeenCalledWith('SettingsAppearance');

    await user.press(view.getByLabelText('Regional'));
    expect(nav.navigate).toHaveBeenCalledWith('SettingsRegional');

    await user.press(view.getByLabelText('Personalization'));
    expect(nav.navigate).toHaveBeenCalledWith('SettingsPersonalization');

    await user.press(view.getByLabelText('Data'));
    expect(nav.navigate).toHaveBeenCalledWith('SettingsData');
  });

  it('renders the entries in the configured language', async () => {
    setConfig({ language: 'es' });
    const view = await render(<SettingsScreen />);

    expect(view.getByText('Apariencia')).toBeTruthy();
    expect(view.getByText('Personalización')).toBeTruthy();
    expect(view.getByText('Datos')).toBeTruthy();
  });
});
