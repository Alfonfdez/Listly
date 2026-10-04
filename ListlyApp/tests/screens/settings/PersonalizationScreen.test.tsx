import { describe, expect, it, beforeEach } from 'vitest';
import { render, userEvent } from '@testing-library/react-native';
import PersonalizationScreen from '../../../src/screens/settings/PersonalizationScreen';
import { getConfigStub, resetStub } from '../../helpers/configStub';

describe('PersonalizationScreen', () => {
  beforeEach(() => resetStub());

  it('renders home, collections, collection detail and lists sections with nested optional fields', async () => {
    const view = await render(<PersonalizationScreen />);
    expect(view.getByText('Home screen')).toBeTruthy();
    expect(view.getByText('Collections screen')).toBeTruthy();
    expect(view.getByText('Collection detail')).toBeTruthy();
    expect(view.getByText('Lists screen')).toBeTruthy();
    expect(view.getByText('Standard lists')).toBeTruthy();
    expect(view.getByText('Numeric lists')).toBeTruthy();
    expect(view.getAllByText('Item display')).toHaveLength(2);
    expect(view.getAllByText('Edit item')).toHaveLength(2);
    expect(view.getAllByText('Optional fields')).toHaveLength(4);
    expect(view.getAllByLabelText('Notes')).toHaveLength(4);
    expect(view.getAllByLabelText('Photos')).toHaveLength(4);
    expect(view.getAllByRole('checkbox')).toHaveLength(8);
  });

  it('stores every layout under its own config key', async () => {
    const user = userEvent.setup();
    const view = await render(<PersonalizationScreen />);
    const updateConfig = getConfigStub().updateConfig;

    const listOptions = view.getAllByLabelText('List');
    await user.press(listOptions[0]!);
    expect(updateConfig).toHaveBeenCalledWith({ homeCollectionsLayout: 'list' });

    await user.press(listOptions[1]!);
    expect(updateConfig).toHaveBeenCalledWith({ homeListsLayout: 'list' });

    await user.press(listOptions[2]!);
    expect(updateConfig).toHaveBeenCalledWith({ collectionsLayout: 'list' });

    await user.press(listOptions[3]!);
    expect(updateConfig).toHaveBeenCalledWith({ collectionDetailLayout: 'list' });

    const gridOptions = view.getAllByLabelText('Grid');
    await user.press(gridOptions[4]!);
    expect(updateConfig).toHaveBeenCalledWith({ listsLayout: 'grid' });
  });

  it('toggles the standard-list item display and edit-item flags', async () => {
    const user = userEvent.setup();
    const view = await render(<PersonalizationScreen />);
    const updateConfig = getConfigStub().updateConfig;

    await user.press(view.getAllByLabelText('Notes')[0]!);
    expect(updateConfig).toHaveBeenCalledWith({ showNotes: false });

    await user.press(view.getAllByLabelText('Photos')[0]!);
    expect(updateConfig).toHaveBeenCalledWith({ showPhotos: false });

    await user.press(view.getAllByLabelText('Notes')[1]!);
    expect(updateConfig).toHaveBeenCalledWith({ editShowNotes: false });

    await user.press(view.getAllByLabelText('Photos')[1]!);
    expect(updateConfig).toHaveBeenCalledWith({ editShowPhotos: false });
  });

  it('toggles the numeric-list item display and edit-item flags', async () => {
    const user = userEvent.setup();
    const view = await render(<PersonalizationScreen />);
    const updateConfig = getConfigStub().updateConfig;

    const notes = view.getAllByLabelText('Notes');
    const photos = view.getAllByLabelText('Photos');
    await user.press(notes[2]!);
    expect(updateConfig).toHaveBeenCalledWith({ showNotesNumeric: false });

    await user.press(view.getAllByLabelText('Photos')[2]!);
    expect(updateConfig).toHaveBeenCalledWith({ showPhotosNumeric: false });

    await user.press(view.getAllByLabelText('Notes')[3]!);
    expect(updateConfig).toHaveBeenCalledWith({ editShowNotesNumeric: false });

    await user.press(view.getAllByLabelText('Photos')[3]!);
    expect(updateConfig).toHaveBeenCalledWith({ editShowPhotosNumeric: false });
  });
});
