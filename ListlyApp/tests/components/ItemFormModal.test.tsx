import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, userEvent } from '@testing-library/react-native';
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
});
