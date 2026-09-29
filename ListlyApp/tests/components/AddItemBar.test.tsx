import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, userEvent } from '@testing-library/react-native';
import { resetStub, setConfig } from '../helpers/configStub';
import AddItemBar from '../../src/components/AddItemBar';

vi.mock('../../src/hooks/useItemPhotos', () => ({
  useItemPhotos: () => ({
    photos: [],
    setPhotos: vi.fn(),
    handleTakePhoto: vi.fn(),
    handlePickFromGallery: vi.fn(),
    handleRemovePhoto: vi.fn(),
  }),
}));

vi.mock('../../src/database', () => ({ itemRepository: { create: vi.fn() } }));

const baseProps = {
  listId: 1,
  existingNames: new Set<string>(),
  position: 0,
  onAdded: () => {},
};

describe('AddItemBar', () => {
  beforeEach(() => resetStub());

  it('shows the details toggle and reveals note + photos by default', async () => {
    const user = userEvent.setup();
    const view = await render(<AddItemBar {...baseProps} />);

    const toggle = view.getByLabelText('Toggle details');
    await user.press(toggle);

    expect(view.getByLabelText('Note')).toBeTruthy();
    expect(view.getByLabelText('Add photo')).toBeTruthy();
  });

  it('hides the note field but keeps photos when showNotes is off', async () => {
    setConfig({ showNotes: false });
    const user = userEvent.setup();
    const view = await render(<AddItemBar {...baseProps} />);

    await user.press(view.getByLabelText('Toggle details'));

    expect(view.queryByLabelText('Note')).toBeNull();
    expect(view.getByLabelText('Add photo')).toBeTruthy();
  });

  it('hides the photo section but keeps the note field when showPhotos is off', async () => {
    setConfig({ showPhotos: false });
    const user = userEvent.setup();
    const view = await render(<AddItemBar {...baseProps} />);

    await user.press(view.getByLabelText('Toggle details'));

    expect(view.getByLabelText('Note')).toBeTruthy();
    expect(view.queryByLabelText('Add photo')).toBeNull();
  });

  it('hides the details toggle when notes and photos are both off', async () => {
    setConfig({ showNotes: false, showPhotos: false });
    const view = await render(<AddItemBar {...baseProps} />);

    expect(view.queryByLabelText('Toggle details')).toBeNull();
    expect(view.queryByLabelText('Note')).toBeNull();
    expect(view.queryByLabelText('Add photo')).toBeNull();
  });

  it('keeps the amount and quantity fields on a numeric list while toggles are off', async () => {
    setConfig({ showNotes: false, showPhotos: false });
    const view = await render(<AddItemBar {...baseProps} numeric />);

    expect(view.getByLabelText('Amount')).toBeTruthy();
    expect(view.getByLabelText('Quantity: 1')).toBeTruthy();
    expect(view.queryByLabelText('Toggle details')).toBeNull();
  });

  it('applies the toggles on a numeric list too', async () => {
    setConfig({ showNotes: false });
    const user = userEvent.setup();
    const view = await render(<AddItemBar {...baseProps} numeric />);

    await user.press(view.getByLabelText('Toggle details'));

    expect(view.getByLabelText('Amount')).toBeTruthy();
    expect(view.queryByLabelText('Note')).toBeNull();
    expect(view.getByLabelText('Add photo')).toBeTruthy();
  });
});
