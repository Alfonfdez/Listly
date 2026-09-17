import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react-native';
import ItemFormModal from '../../src/components/ItemFormModal';
import { resetStub, setConfig } from '../helpers/configStub';

vi.mock('../../src/hooks/useItemPhotos', () => ({
  useItemPhotos: () => ({
    photos: [],
    setPhotos: vi.fn(),
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
});
