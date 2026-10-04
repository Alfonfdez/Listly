import { describe, expect, it, beforeEach, vi } from 'vitest';
import { act, render, userEvent } from '@testing-library/react-native';
import ItemFormModal from '../../src/components/ItemFormModal';
import { resetStub, setConfig } from '../helpers/configStub';

const setPhotosMock = vi.fn();

vi.mock('../../src/hooks/useItemPhotos', () => ({
  useItemPhotos: () => ({
    photos: [],
    setPhotos: setPhotosMock,
    handleTakePhoto: vi.fn(),
    handlePickFromGallery: vi.fn(),
    handleRemovePhoto: vi.fn(),
  }),
}));

const baseProps = {
  visible: true,
  title: 'Edit item',
  initialName: 'Milk',
  initialNote: 'whole',
  initialPhotos: [],
  existingNames: new Set<string>(),
  allowDelete: true,
  onCancel: () => {},
  onSave: () => {},
  onDelete: () => {},
};

describe('ItemFormModal', () => {
  beforeEach(() => resetStub());

  it('shows the note and photo fields by default', async () => {
    const view = await render(<ItemFormModal {...baseProps} />);
    expect(view.getByLabelText('Note')).toBeTruthy();
    expect(view.getByLabelText('Add photo')).toBeTruthy();
  });

  it('hides the note and photo fields when the edit-item toggles are off', async () => {
    setConfig({ editShowNotes: false, editShowPhotos: false });
    const view = await render(<ItemFormModal {...baseProps} />);
    expect(view.queryByLabelText('Note')).toBeNull();
    expect(view.queryByLabelText('Add photo')).toBeNull();
  });

  it('keeps the edit fields when only the list-detail toggles are off', async () => {
    setConfig({ showNotes: false, showPhotos: false });
    const view = await render(<ItemFormModal {...baseProps} />);
    expect(view.getByLabelText('Note')).toBeTruthy();
    expect(view.getByLabelText('Add photo')).toBeTruthy();
  });

  it('hides the photo field when photos are not allowed (locked list)', async () => {
    const view = await render(<ItemFormModal {...baseProps} photosAllowed={false} />);
    expect(view.getByLabelText('Note')).toBeTruthy();
    expect(view.queryByLabelText('Add photo')).toBeNull();
  });

  it('saves no photos when photos are not allowed', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    const view = await render(<ItemFormModal {...baseProps} initialPhotos={['a']} photosAllowed={false} onSave={onSave} />);
    await user.press(view.getByLabelText('Save'));
    expect(onSave).toHaveBeenCalledWith('Milk', 'whole', [], null, 0);
  });

  it('keeps the numeric edit fields when only the standard edit toggles are off', async () => {
    setConfig({ editShowNotes: false, editShowPhotos: false, editShowNotesNumeric: true, editShowPhotosNumeric: true });
    const view = await render(<ItemFormModal {...baseProps} numeric />);
    expect(view.getByLabelText('Note')).toBeTruthy();
    expect(view.getByLabelText('Add photo')).toBeTruthy();
  });

  it('hides the numeric edit fields when the numeric edit toggles are off', async () => {
    setConfig({ editShowNotes: true, editShowPhotos: true, editShowNotesNumeric: false, editShowPhotosNumeric: false });
    const view = await render(<ItemFormModal {...baseProps} numeric />);
    expect(view.queryByLabelText('Note')).toBeNull();
    expect(view.queryByLabelText('Add photo')).toBeNull();
  });

  it('does not reset typed input when the parent re-renders while open', async () => {
    setPhotosMock.mockClear();
    const user = userEvent.setup();
    const view = await render(<ItemFormModal {...baseProps} />);
    const input = view.getByLabelText('Name');
    await user.clear(input);
    await user.type(input, 'Bread');

    // Parent re-renders with a new initialPhotos array identity (same content).
    view.rerender(<ItemFormModal {...baseProps} initialPhotos={[]} />);

    expect(view.getByLabelText('Name').props.value).toBe('Bread');
    expect(setPhotosMock).toHaveBeenCalledTimes(1);
  });

  it('blanks a zero amount on focus so the user can type immediately', async () => {
    const view = await render(
      <ItemFormModal {...baseProps} numeric initialAmountMinor={0} initialQuantity={1} initialNote="" />
    );
    expect(view.getByLabelText('Amount').props.value).toBe('0.00');
    await act(async () => {
      view.getByLabelText('Amount').props.onFocus();
    });
    expect(view.getByLabelText('Amount').props.value).toBe('');
  });

  it('keeps a non-zero amount on focus', async () => {
    const view = await render(
      <ItemFormModal {...baseProps} numeric initialAmountMinor={120} initialQuantity={1} initialNote="" />
    );
    expect(view.getByLabelText('Amount').props.value).toBe('1.20');
    await act(async () => {
      view.getByLabelText('Amount').props.onFocus();
    });
    expect(view.getByLabelText('Amount').props.value).toBe('1.20');
  });

  it('restores the zero amount when focused then blurred without typing', async () => {
    const view = await render(
      <ItemFormModal {...baseProps} numeric initialAmountMinor={0} initialQuantity={1} initialNote="" />
    );
    await act(async () => {
      view.getByLabelText('Amount').props.onFocus();
    });
    expect(view.getByLabelText('Amount').props.value).toBe('');
    await act(async () => {
      view.getByLabelText('Amount').props.onBlur();
    });
    expect(view.getByLabelText('Amount').props.value).toBe('0.00');
  });

  it('persists the amount typed after focusing a zero field', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    const view = await render(
      <ItemFormModal
        {...baseProps}
        numeric
        initialAmountMinor={0}
        initialQuantity={1}
        initialNote=""
        onSave={onSave}
      />
    );
    view.getByLabelText('Amount').props.onFocus();
    await user.type(view.getByLabelText('Amount'), '2.50');
    await user.press(view.getByLabelText('Save'));
    expect(onSave).toHaveBeenCalledWith('Milk', null, [], 250, 1);
  });
});
