import { describe, expect, it, beforeEach } from 'vitest';
import { render } from '@testing-library/react-native';
import ItemRow from '../../src/components/ItemRow';
import { resetStub, setConfig } from '../helpers/configStub';
import type { Item } from '../../src/database/types';

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 1,
    list_id: 1,
    name: 'Milk',
    checked: 0,
    note: 'medium roast',
    updated_at: 'x',
    pictures: null,
    amount_minor: null,
    quantity: 0,
    position: 0,
    created_at: 'x',
    ...overrides,
  };
}

const defaults = { selectMode: false, selected: false };

describe('ItemRow per-kind flags', () => {
  beforeEach(() => resetStub());

  it('follows the numeric flags on a numeric list independently of the standard flags', async () => {
    setConfig({ showNotes: false, showNotesNumeric: true });
    const view = await render(
      <ItemRow item={makeItem()} {...defaults} numeric onToggle={() => {}} onEdit={() => {}} />
    );
    expect(view.getByText('medium roast')).toBeTruthy();
  });

  it('hides the note on a standard list when the standard flag is off', async () => {
    setConfig({ showNotes: false, showNotesNumeric: true });
    const view = await render(<ItemRow item={makeItem()} {...defaults} onToggle={() => {}} onEdit={() => {}} />);
    expect(view.queryByText('medium roast')).toBeNull();
  });

  it('hides numeric notes when only the numeric flag is off', async () => {
    setConfig({ showNotes: true, showNotesNumeric: false });
    const view = await render(
      <ItemRow item={makeItem()} {...defaults} numeric onToggle={() => {}} onEdit={() => {}} />
    );
    expect(view.queryByText('medium roast')).toBeNull();
  });

  it('hides numeric photos when only the numeric flag is off', async () => {
    setConfig({ showPhotos: true, showPhotosNumeric: false });
    const item = makeItem({ pictures: JSON.stringify(['data:image/a']) });
    const view = await render(<ItemRow item={item} {...defaults} numeric onToggle={() => {}} onEdit={() => {}} />);
    expect(view.queryByLabelText('Photos')).toBeNull();
  });
});
