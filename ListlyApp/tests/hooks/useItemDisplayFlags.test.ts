import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react-native';
import { useItemDisplayFlags } from '../../src/hooks/useItemDisplayFlags';
import { resetStub, setConfig } from '../helpers/configStub';

describe('useItemDisplayFlags', () => {
  beforeEach(() => resetStub());

  it('returns the standard flags for a standard list', async () => {
    setConfig({
      showNotes: false,
      showPhotos: true,
      editShowNotes: false,
      editShowPhotos: true,
      showNotesNumeric: true,
      showPhotosNumeric: true,
      editShowNotesNumeric: true,
      editShowPhotosNumeric: true,
    });
    const { result } = await renderHook(() => useItemDisplayFlags(false));

    expect(result.current).toEqual({
      showNotes: false,
      showPhotos: true,
      editShowNotes: false,
      editShowPhotos: true,
    });
  });

  it('returns the numeric flags for a numeric list', async () => {
    setConfig({
      showNotes: true,
      showPhotos: true,
      editShowNotes: true,
      editShowPhotos: true,
      showNotesNumeric: false,
      showPhotosNumeric: true,
      editShowNotesNumeric: false,
      editShowPhotosNumeric: true,
    });
    const { result } = await renderHook(() => useItemDisplayFlags(true));

    expect(result.current).toEqual({
      showNotes: false,
      showPhotos: true,
      editShowNotes: false,
      editShowPhotos: true,
    });
  });

  it('defaults both kinds to all-on', async () => {
    const standard = await renderHook(() => useItemDisplayFlags(false));
    expect(standard.result.current).toEqual({
      showNotes: true,
      showPhotos: true,
      editShowNotes: true,
      editShowPhotos: true,
    });

    const numeric = await renderHook(() => useItemDisplayFlags(true));
    expect(numeric.result.current).toEqual({
      showNotes: true,
      showPhotos: true,
      editShowNotes: true,
      editShowPhotos: true,
    });
  });
});
