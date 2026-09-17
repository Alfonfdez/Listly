import { describe, expect, it, beforeEach } from 'vitest';
import { render, userEvent } from '@testing-library/react-native';
import PersonalizationScreen from '../../../src/screens/settings/PersonalizationScreen';
import { getConfigStub, resetStub } from '../../helpers/configStub';

describe('PersonalizationScreen', () => {
  beforeEach(() => resetStub());

  it('renders home and lists sections with nested optional fields', async () => {
    const view = await render(<PersonalizationScreen />);
    expect(view.getByText('Home screen')).toBeTruthy();
    expect(view.getByText('Lists screen')).toBeTruthy();
    expect(view.getByText('Item display')).toBeTruthy();
    expect(view.getByText('Edit item')).toBeTruthy();
    expect(view.getAllByText('Optional fields')).toHaveLength(2);
    expect(view.getAllByLabelText('Notes')).toHaveLength(2);
    expect(view.getAllByLabelText('Photos')).toHaveLength(2);
    expect(view.getAllByRole('checkbox')).toHaveLength(4);
  });

  it('stores the home and lists layouts under separate keys', async () => {
    const user = userEvent.setup();
    const view = await render(<PersonalizationScreen />);
    const updateConfig = getConfigStub().updateConfig;

    const listOptions = view.getAllByLabelText('List');
    await user.press(listOptions[0]!);
    expect(updateConfig).toHaveBeenCalledWith({ homeLayout: 'list' });

    const gridOptions = view.getAllByLabelText('Grid');
    await user.press(gridOptions[1]!);
    expect(updateConfig).toHaveBeenCalledWith({ listsLayout: 'grid' });
  });

  it('toggles the list-detail item display flags', async () => {
    const user = userEvent.setup();
    const view = await render(<PersonalizationScreen />);
    const updateConfig = getConfigStub().updateConfig;

    await user.press(view.getAllByLabelText('Notes')[0]!);
    expect(updateConfig).toHaveBeenCalledWith({ showNotes: false });

    await user.press(view.getAllByLabelText('Photos')[0]!);
    expect(updateConfig).toHaveBeenCalledWith({ showPhotos: false });
  });

  it('toggles the edit-item field flags', async () => {
    const user = userEvent.setup();
    const view = await render(<PersonalizationScreen />);
    const updateConfig = getConfigStub().updateConfig;

    await user.press(view.getAllByLabelText('Notes')[1]!);
    expect(updateConfig).toHaveBeenCalledWith({ editShowNotes: false });

    await user.press(view.getAllByLabelText('Photos')[1]!);
    expect(updateConfig).toHaveBeenCalledWith({ editShowPhotos: false });
  });
});
