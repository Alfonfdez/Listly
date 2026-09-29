import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react-native';
import { EMPTY_ITEM_DRAFT, useItemDraft } from '../../src/hooks/useItemDraft';

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

describe('useItemDraft', () => {
  beforeEach(() => setPhotosMock.mockClear());

  it('validates the name on demand', async () => {
    const { result } = await renderHook(() => useItemDraft({ existingNames: new Set<string>() }));

    let err: unknown;
    await act(async () => {
      err = result.current.validate();
    });
    expect(err).toBeTruthy();
    expect(result.current.error).toBe(err);

    await act(async () => {
      result.current.setName('Milk');
    });
    await act(async () => {
      err = result.current.validate();
    });
    expect(err).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('flags a duplicate name', async () => {
    const { result } = await renderHook(() => useItemDraft({ existingNames: new Set(['milk']) }));
    await act(async () => {
      result.current.setName('milk');
    });
    await act(async () => {
      result.current.validate();
    });
    expect(result.current.error).toBe('item_name_duplicate');
  });

  it('builds a numeric payload and a plain payload for standard lists', async () => {
    const numeric = await renderHook(() => useItemDraft({ existingNames: new Set(), numeric: true }));
    await act(async () => {
      numeric.result.current.setName(' Milk ');
    });
    await act(async () => {
      numeric.result.current.onAmountChange('1.50');
    });
    await act(async () => {
      numeric.result.current.setQuantity(3);
    });
    expect(numeric.result.current.buildPayload()).toMatchObject({ name: 'Milk', amountMinor: 150, quantity: 3 });

    const standard = await renderHook(() => useItemDraft({ existingNames: new Set() }));
    await act(async () => {
      standard.result.current.setName('Milk');
    });
    await act(async () => {
      standard.result.current.onAmountChange('1.50');
    });
    await act(async () => {
      standard.result.current.setQuantity(3);
    });
    expect(standard.result.current.buildPayload()).toMatchObject({ name: 'Milk', amountMinor: null, quantity: 0 });
  });

  it('sanitizes the amount input', async () => {
    const { result } = await renderHook(() => useItemDraft({ existingNames: new Set(), numeric: true }));
    await act(async () => {
      result.current.onAmountChange('1a2.345');
    });
    expect(result.current.amount).toBe('12.34');
  });

  it('applies a seed and resets back to empty', async () => {
    const { result } = await renderHook(() => useItemDraft({ existingNames: new Set() }));

    await act(async () => {
      result.current.applySeed({ name: 'Milk', note: 'whole', photos: ['a'], amountMinor: 250, quantity: 2 });
    });
    expect(result.current.name).toBe('Milk');
    expect(result.current.note).toBe('whole');
    expect(result.current.amount).toBe('2.50');
    expect(result.current.quantity).toBe(2);
    expect(setPhotosMock).toHaveBeenCalledWith(['a']);

    await act(async () => {
      result.current.reset();
    });
    expect(result.current.name).toBe('');
    expect(result.current.note).toBe('');
    expect(result.current.amount).toBe('');
    expect(result.current.quantity).toBe(EMPTY_ITEM_DRAFT.quantity);
    expect(setPhotosMock).toHaveBeenLastCalledWith([]);
  });

  it('validates live on change only when asked', async () => {
    const live = await renderHook(() => useItemDraft({ existingNames: new Set(), validateOnChange: true }));
    await act(async () => {
      live.result.current.onNameChange('');
    });
    expect(live.result.current.error).toBeTruthy();

    const lazy = await renderHook(() => useItemDraft({ existingNames: new Set() }));
    await act(async () => {
      lazy.result.current.validate();
    });
    expect(lazy.result.current.error).toBeTruthy();
    await act(async () => {
      lazy.result.current.onNameChange('M');
    });
    expect(lazy.result.current.error).toBeNull();
  });
});
