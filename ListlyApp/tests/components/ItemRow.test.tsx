import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react-native';
import { userEvent } from '@testing-library/react-native';
import ItemRow from '../../src/components/ItemRow';
import { resetStub, setConfig } from '../helpers/configStub';
import { ALPHA_SUBTLE } from '../../src/components/componentStyles';
import { darkColors } from '../../src/constants/themes';
import { withAlpha } from '../../src/utils/color';
import type { Item } from '../../src/database/types';

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 1,
    list_id: 1,
    name: 'Milk',
    checked: 0,
    note: null,
    pictures: null,
    position: 0,
    created_at: 'x',
    ...overrides,
  };
}

const defaults = { selectMode: false, selected: false };

describe('ItemRow', () => {
  beforeEach(() => {
    resetStub();
  });

  it('renders the item name and an unchecked checkbox', async () => {
    const view = await render(<ItemRow item={makeItem()} {...defaults} onToggle={() => {}} onEdit={() => {}} />);
    expect(view.getByText('Milk')).toBeTruthy();
    expect(view.getByText('ellipse-outline')).toBeTruthy();
    expect(view.queryByText('checkmark-circle')).toBeNull();
  });

  it('hides thumbnails when the item has no pictures', async () => {
    const view = await render(<ItemRow item={makeItem()} {...defaults} onToggle={() => {}} onEdit={() => {}} />);
    expect(view.queryByLabelText('Photos')).toBeNull();
  });

  it('renders a thumbnail per picture', async () => {
    const item = makeItem({ pictures: JSON.stringify(['data:image/a', 'data:image/b']) });
    const view = await render(<ItemRow item={item} {...defaults} onToggle={() => {}} onEdit={() => {}} />);
    expect(view.getAllByLabelText('Photos')).toHaveLength(2);
  });

  it('uses a filled checkmark and a green wash (no strike-through) for checked items', async () => {
    const item = makeItem({ checked: 1 });
    const view = await render(<ItemRow item={item} {...defaults} onToggle={() => {}} onEdit={() => {}} />);
    expect(view.getByText('checkmark-circle')).toBeTruthy();

    const name = view.getByText('Milk');
    expect(flattenStyle(name.props.style).textDecorationLine).toBeUndefined();

    const row = view.getByRole('checkbox');
    expect(flattenStyle(row.props.style).backgroundColor).toBe(withAlpha(darkColors.green, ALPHA_SUBTLE));
  });

  it('shows the note preview only when a note is set', async () => {
    const noNote = await render(<ItemRow item={makeItem()} {...defaults} onToggle={() => {}} onEdit={() => {}} />);
    expect(noNote.queryByText('medium roast')).toBeNull();

    const withNote = await render(
      <ItemRow item={makeItem({ note: 'medium roast' })} {...defaults} onToggle={() => {}} onEdit={() => {}} />
    );
    expect(withNote.getByText('medium roast')).toBeTruthy();
  });

  it('hides the note preview in select mode', async () => {
    const view = await render(
      <ItemRow item={makeItem({ note: 'medium roast' })} {...defaults} selectMode onToggle={() => {}} onEdit={() => {}} />
    );
    expect(view.queryByText('medium roast')).toBeNull();
  });

  it('opens the full note viewer from the note preview', async () => {
    const user = userEvent.setup();
    const view = await render(
      <ItemRow item={makeItem({ note: 'medium roast' })} {...defaults} onToggle={() => {}} onEdit={() => {}} />
    );

    await user.press(view.getByLabelText('View note'));
    expect(await view.findByLabelText('Close')).toBeTruthy();

    await user.press(view.getByLabelText('Close'));
  });

  it('does not toggle when tapping the note preview', async () => {
    const onToggle = vi.fn();
    const view = await render(
      <ItemRow item={makeItem({ note: 'milk whole' })} {...defaults} onToggle={onToggle} onEdit={() => {}} />
    );

    fireEvent.press(view.getByText('milk whole'));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('does not toggle when tapping a photo thumbnail', async () => {
    const onToggle = vi.fn();
    const item = makeItem({ pictures: JSON.stringify(['data:image/a']) });
    const view = await render(<ItemRow item={item} {...defaults} onToggle={onToggle} onEdit={() => {}} />);

    fireEvent.press(view.getByRole('imagebutton'));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('toggles on row press and opens the editor on the edit button', async () => {
    const onToggle = vi.fn();
    const onEdit = vi.fn();
    const view = await render(<ItemRow item={makeItem()} {...defaults} onToggle={onToggle} onEdit={onEdit} />);

    fireEvent.press(view.getByText('Milk'));
    expect(onToggle).toHaveBeenCalledTimes(1);

    fireEvent.press(view.getByLabelText('Edit item'));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('hides notes everywhere when showNotes is off', async () => {
    setConfig({ showNotes: false });
    const view = await render(
      <ItemRow item={makeItem({ note: 'medium roast' })} {...defaults} onToggle={() => {}} onEdit={() => {}} />
    );
    expect(view.queryByText('medium roast')).toBeNull();
  });

  it('hides photos when showPhotos is off', async () => {
    setConfig({ showPhotos: false });
    const item = makeItem({ pictures: JSON.stringify(['data:image/a', 'data:image/b']) });
    const view = await render(<ItemRow item={item} {...defaults} onToggle={() => {}} onEdit={() => {}} />);
    expect(view.queryByLabelText('Photos')).toBeNull();
  });
});

function flattenStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return style.reduce((acc: Record<string, unknown>, s) => ({ ...acc, ...flattenStyle(s) }), {});
  }
  if (style && typeof style === 'object') {
    return { ...(style as Record<string, unknown>) };
  }
  return {};
}