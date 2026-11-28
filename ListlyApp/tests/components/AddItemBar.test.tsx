import { flattenStyle } from '../helpers/style';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, userEvent } from '@testing-library/react-native';
import { resetStub, setConfig } from '../helpers/configStub';
import AddItemBar from '../../src/components/AddItemBar';
import {
  ADD_ITEM_NOTE_LINES,
  CURRENCY_SLOT_WIDTH,
  EDIT_ITEM_FIELD_LINE_HEIGHT,
  EDIT_ITEM_FIELD_VERTICAL_PADDING,
  LINE_TOTAL_SLOT_WIDTH,
  PHOTO_METRICS,
} from '../../src/constants/layout';

const NOTE_INPUT_HEIGHT = EDIT_ITEM_FIELD_LINE_HEIGHT * ADD_ITEM_NOTE_LINES + EDIT_ITEM_FIELD_VERTICAL_PADDING;

vi.mock('../../src/hooks/useItemPhotos', () => ({
  useItemPhotos: () => ({
    photos: [],
    setPhotos: vi.fn(),
    handleTakePhoto: vi.fn(),
    handlePickFromGallery: vi.fn(),
    handleRemovePhoto: vi.fn(),
  }),
}));

vi.mock('../../src/database', () => ({ itemRepo: { create: vi.fn() } }));

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

  it('uses a three-line note and compact photo tiles in the details area', async () => {
    const user = userEvent.setup();
    const view = await render(<AddItemBar {...baseProps} />);

    await user.press(view.getByLabelText('Toggle details'));

    const note = view.getByLabelText('Note');
    expect(note.props.numberOfLines).toBe(ADD_ITEM_NOTE_LINES);
    expect(flattenStyle(note.props.style).height).toBe(NOTE_INPUT_HEIGHT);
    expect(flattenStyle(view.getByLabelText('Add photo').props.style).width).toBe(PHOTO_METRICS.compact.size);
  });

  it('uses the compact details on numeric lists too', async () => {
    const user = userEvent.setup();
    const view = await render(<AddItemBar {...baseProps} numeric />);

    await user.press(view.getByLabelText('Toggle details'));

    expect(view.getByLabelText('Amount')).toBeTruthy();
    expect(view.getByLabelText('Note').props.numberOfLines).toBe(ADD_ITEM_NOTE_LINES);
    expect(flattenStyle(view.getByLabelText('Add photo').props.style).width).toBe(PHOTO_METRICS.compact.size);
  });

  it('hides the photo section when the list is locked (photosAllowed false)', async () => {
    const user = userEvent.setup();
    const view = await render(<AddItemBar {...baseProps} photosAllowed={false} />);

    await user.press(view.getByLabelText('Toggle details'));

    expect(view.getByLabelText('Note')).toBeTruthy();
    expect(view.queryByLabelText('Add photo')).toBeNull();
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
    setConfig({ showNotesNumeric: false, showPhotosNumeric: false });
    const view = await render(<AddItemBar {...baseProps} numeric />);

    expect(view.getByLabelText('Amount')).toBeTruthy();
    expect(view.getByLabelText('Quantity: 1')).toBeTruthy();
    expect(view.queryByLabelText('Toggle details')).toBeNull();
  });

  it('keeps the numeric line total in a fixed slot', async () => {
    const user = userEvent.setup();
    const view = await render(<AddItemBar {...baseProps} numeric />);

    const total = view.getByLabelText(/^Total: /);
    const style = flattenStyle(total.props.style);
    expect(total.props.numberOfLines).toBe(1);
    expect(style.width).toBe(LINE_TOTAL_SLOT_WIDTH + CURRENCY_SLOT_WIDTH);
    expect(style.paddingRight).toBe(CURRENCY_SLOT_WIDTH);

    await user.type(view.getByLabelText('Amount'), '999999.99');

    expect(view.getByLabelText('Total: 999999.99')).toBeTruthy();
    expect(flattenStyle(view.getByLabelText(/^Total: /).props.style).width).toBe(style.width);
  });

  it('applies the numeric toggles on a numeric list', async () => {
    setConfig({ showNotesNumeric: false });
    const user = userEvent.setup();
    const view = await render(<AddItemBar {...baseProps} numeric />);

    await user.press(view.getByLabelText('Toggle details'));

    expect(view.getByLabelText('Amount')).toBeTruthy();
    expect(view.queryByLabelText('Note')).toBeNull();
    expect(view.getByLabelText('Add photo')).toBeTruthy();
  });

  it('uses the standard toggles on a standard list independently of the numeric ones', async () => {
    setConfig({ showNotes: false, showNotesNumeric: true });
    const user = userEvent.setup();
    const view = await render(<AddItemBar {...baseProps} />);

    await user.press(view.getByLabelText('Toggle details'));

    expect(view.queryByLabelText('Note')).toBeNull();
  });
});
