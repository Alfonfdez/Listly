import { useCallback, useRef, useState } from 'react';
import { useItemPhotos } from './useItemPhotos';
import { validateItemName, type ItemNameError } from '../utils/validation';
import { clampQuantity, formatMinor, lineTotalMinor, parseAmountInput, sanitizeAmountText } from '../utils/numeric';
import { DEFAULT_QUANTITY } from '../constants/types';

export interface ItemDraftSeed {
  name: string;
  note: string;
  photos: string[];
  amountMinor: number | null;
  quantity: number;
}

interface ItemDraftPayload {
  name: string;
  note: string | null;
  photos: string[];
  amountMinor: number | null;
  quantity: number;
}

interface Options {
  existingNames: ReadonlySet<string>;
  numeric?: boolean;
  validateOnChange?: boolean;
}

export const EMPTY_ITEM_DRAFT: ItemDraftSeed = {
  name: '',
  note: '',
  photos: [],
  amountMinor: null,
  quantity: DEFAULT_QUANTITY,
};

export function useItemDraft({ existingNames, numeric = false, validateOnChange = false }: Options) {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState(DEFAULT_QUANTITY);
  const [error, setError] = useState<ItemNameError | null>(null);
  const { photos, setPhotos, handleTakePhoto, handlePickFromGallery, handleRemovePhoto } = useItemPhotos();
  const amountBeforeFocus = useRef('');
  const amountTouched = useRef(false);

  const amountMinor = parseAmountInput(amount);
  const lineTotal = lineTotalMinor(amountMinor, quantity);

  const onNameChange = useCallback(
    (value: string) => {
      setName(value);
      setError(validateOnChange ? validateItemName(value, existingNames) : null);
    },
    [validateOnChange, existingNames]
  );

  const onAmountChange = useCallback((text: string) => {
    amountTouched.current = true;
    setAmount(sanitizeAmountText(text));
  }, []);

  const onAmountFocus = useCallback(() => {
    amountTouched.current = false;
    setAmount(current => {
      amountBeforeFocus.current = current;
      return parseAmountInput(current) === 0 ? '' : current;
    });
  }, []);

  const onAmountBlur = useCallback(() => {
    if (amountTouched.current) return;
    setAmount(current => {
      if (current === '' && amountBeforeFocus.current !== '') {
        return amountBeforeFocus.current;
      }
      return current;
    });
  }, []);

  const validate = useCallback((): ItemNameError | null => {
    const err = validateItemName(name, existingNames);
    setError(err);
    return err;
  }, [name, existingNames]);

  const applySeed = useCallback(
    (seed: ItemDraftSeed) => {
      setName(seed.name);
      setNote(seed.note);
      setPhotos(seed.photos);
      setAmount(seed.amountMinor === null ? '' : formatMinor(seed.amountMinor));
      setQuantity(seed.quantity);
      setError(null);
      amountBeforeFocus.current = '';
      amountTouched.current = false;
    },
    [setPhotos]
  );

  const reset = useCallback(() => applySeed(EMPTY_ITEM_DRAFT), [applySeed]);

  const buildPayload = useCallback(
    (): ItemDraftPayload => ({
      name: name.trim(),
      note: note.trim() ? note.trim() : null,
      photos,
      amountMinor: numeric ? amountMinor : null,
      quantity: numeric ? clampQuantity(quantity) : 0,
    }),
    [name, note, photos, numeric, amountMinor, quantity]
  );

  return {
    name,
    note,
    amount,
    quantity,
    error,
    amountMinor,
    lineTotal,
    photos,
    setName,
    setNote,
    setAmount,
    setQuantity,
    onNameChange,
    onAmountChange,
    onAmountFocus,
    onAmountBlur,
    handleTakePhoto,
    handlePickFromGallery,
    handleRemovePhoto,
    validate,
    applySeed,
    reset,
    buildPayload,
  };
}
