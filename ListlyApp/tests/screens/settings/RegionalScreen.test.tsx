import { describe, expect, it, beforeEach } from 'vitest';
import { render, userEvent } from '@testing-library/react-native';
import RegionalScreen from '../../../src/screens/settings/RegionalScreen';
import { getConfigStub, resetStub, setConfig } from '../../helpers/configStub';

describe('RegionalScreen', () => {
  beforeEach(() => resetStub());

  it('shows the current language and applies a picked one after confirming', async () => {
    const user = userEvent.setup();
    const view = await render(<RegionalScreen />);
    const updateConfig = getConfigStub().updateConfig;

    expect(view.getByLabelText('Language')).toBeTruthy();
    expect(view.getAllByText('Language')).toHaveLength(2);
    expect(view.getByText('English')).toBeTruthy();
    expect(view.queryByText('Select language')).toBeNull();

    await user.press(view.getByLabelText('Language'));
    expect(await view.findByText('Select language')).toBeTruthy();

    await user.press(view.getByLabelText('Español'));
    expect(updateConfig).not.toHaveBeenCalled();

    await user.press(view.getByLabelText('Select'));
    expect(updateConfig).toHaveBeenCalledWith({ language: 'es' });
    expect(view.queryByText('Select language')).toBeNull();
  });

  it('discards the picked language when cancelled', async () => {
    const user = userEvent.setup();
    const view = await render(<RegionalScreen />);
    const updateConfig = getConfigStub().updateConfig;

    await user.press(view.getByLabelText('Language'));
    await user.press(view.getByLabelText('Español'));
    await user.press(view.getByLabelText('Cancel'));

    expect(updateConfig).not.toHaveBeenCalled();
    expect(view.queryByText('Select language')).toBeNull();
  });

  it('reflects the configured language in the picker row', async () => {
    setConfig({ language: 'es' });
    const view = await render(<RegionalScreen />);
    expect(view.getByText('Español')).toBeTruthy();
  });

  it('shows the default currency and number format', async () => {
    const view = await render(<RegionalScreen />);
    expect(view.getByLabelText('Currency')).toBeTruthy();
    expect(view.getByLabelText('Decimal separator')).toBeTruthy();
    expect(view.getByText('None')).toBeTruthy();
    expect(view.getByText('Plain (1234.56)')).toBeTruthy();
  });

  it('searches and applies a currency', async () => {
    const user = userEvent.setup();
    const view = await render(<RegionalScreen />);
    const updateConfig = getConfigStub().updateConfig;

    await user.press(view.getByLabelText('Currency'));
    await user.type(view.getByLabelText('Search'), 'franc');
    expect(view.queryByLabelText('Euro')).toBeNull();
    await user.press(view.getByLabelText('Swiss Franc'));
    await user.press(view.getByLabelText('Select'));

    expect(updateConfig).toHaveBeenCalledWith({ currency: 'currency_chf' });
  });

  it('applies a number format', async () => {
    const user = userEvent.setup();
    const view = await render(<RegionalScreen />);
    const updateConfig = getConfigStub().updateConfig;

    await user.press(view.getByLabelText('Decimal separator'));
    await user.press(view.getByLabelText('Comma (1.234,56)'));
    await user.press(view.getByLabelText('Select'));

    expect(updateConfig).toHaveBeenCalledWith({ amountFormat: 'comma' });
  });
});
