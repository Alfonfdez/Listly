import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react-native';
import { resetStub } from '../helpers/configStub';
import { flattenStyle } from '../helpers/style';
import {
  ItemAmountField,
  ItemLineTotal,
  ItemNameField,
  ItemNoteField,
  ItemQuantityField,
} from '../../src/components/ItemFields';
import { EDIT_ITEM_NAME_LINES, LINE_TOTAL_SLOT_WIDTH } from '../../src/constants/layout';
import { currencySuffixWidth } from '../../src/constants/currencies';
import { AMOUNT_FORMATS, MAX_AMOUNT_MINOR, MAX_QUANTITY } from '../../src/constants/types';

describe('ItemFields', () => {
  beforeEach(() => resetStub());

  it('ItemLineTotal formats amount × quantity and exposes the labelled total', async () => {
    const view = await render(<ItemLineTotal amountMinor={250} quantity={3} fontSize={14} />);

    expect(view.getByText('7.50')).toBeTruthy();
    expect(view.getByLabelText('Total: 7.50')).toBeTruthy();
  });

  it('ItemLineTotal keeps the clamped maximum inside a fixed slot', async () => {
    const view = await render(
      <ItemLineTotal amountMinor={MAX_AMOUNT_MINOR} quantity={MAX_QUANTITY} fontSize={15} />,
    );

    const total = view.getByText('999999.99');
    const style = flattenStyle(total.props.style);
    expect(total.props.numberOfLines).toBe(1);
    expect(style.width).toBe(LINE_TOTAL_SLOT_WIDTH + currencySuffixWidth('none'));
    expect(style.textAlign).toBe('right');
  });

  it('fits the grouped maximum without clipping', async () => {
    const view = await render(
      <ItemLineTotal
        amountMinor={MAX_AMOUNT_MINOR}
        quantity={1}
        fontSize={15}
        amountFormat={AMOUNT_FORMATS.comma}
      />,
    );

    const total = view.getByText('999.999,99');
    expect(flattenStyle(total.props.style).width).toBe(
      LINE_TOTAL_SLOT_WIDTH + currencySuffixWidth('none'),
    );
  });

  it('formats a currency with the configured separator and reserves its width', async () => {
    const view = await render(
      <ItemLineTotal
        amountMinor={123456}
        quantity={1}
        fontSize={15}
        currency="currency_euro"
        amountFormat={AMOUNT_FORMATS.comma}
      />,
    );

    const total = view.getByText('1.234,56 €');
    expect(view.getByLabelText('Total: 1.234,56 €')).toBeTruthy();
    expect(flattenStyle(total.props.style).width).toBe(
      LINE_TOTAL_SLOT_WIDTH + currencySuffixWidth('currency_euro'),
    );
  });

  it('fits a three-letter currency code in the slot', async () => {
    const view = await render(
      <ItemLineTotal
        amountMinor={123456}
        quantity={1}
        fontSize={15}
        currency="currency_chf"
        amountFormat={AMOUNT_FORMATS.dot}
      />,
    );

    const total = view.getByText('1,234.56 CHF');
    expect(flattenStyle(total.props.style).width).toBe(
      LINE_TOTAL_SLOT_WIDTH + currencySuffixWidth('currency_chf'),
    );
  });

  it('ItemNoteField renders the counter and forwards typing', async () => {
    const onChangeText = vi.fn();
    const view = await render(<ItemNoteField value="whole" onChangeText={onChangeText} style={{}} />);

    expect(view.getByText('5/2000')).toBeTruthy();
    fireEvent.changeText(view.getByLabelText('Note'), 'skim');
    expect(onChangeText).toHaveBeenCalledWith('skim');
  });

  it('can hide the counters when the label row hosts them', async () => {
    const name = await render(
      <ItemNameField
        value="Milk"
        onChangeText={vi.fn()}
        placeholder="Name"
        accessibilityLabel="Name"
        style={{}}
        showCounter={false}
      />,
    );
    expect(name.queryByText('4/200')).toBeNull();

    const note = await render(<ItemNoteField value="note" onChangeText={vi.fn()} style={{}} showCounter={false} />);
    expect(note.queryByText('4/2000')).toBeNull();
  });

  it('ItemNameField renders the counter and forwards typing', async () => {
    const onChangeText = vi.fn();
    const view = await render(
      <ItemNameField
        value="Milk"
        onChangeText={onChangeText}
        placeholder="Add an item..."
        accessibilityLabel="Add an item..."
        style={{}}
      />,
    );

    expect(view.getByText('4/200')).toBeTruthy();
    fireEvent.changeText(view.getByLabelText('Add an item...'), 'Bread');
    expect(onChangeText).toHaveBeenCalledWith('Bread');
  });

  it('ItemNameField supports a multiline name (edit modal)', async () => {
    const view = await render(
      <ItemNameField
        value="A long item name"
        onChangeText={() => {}}
        placeholder="Name"
        accessibilityLabel="Name"
        style={{}}
        multiline
      />,
    );

    const input = view.getByLabelText('Name');
    expect(input.props.multiline).toBe(true);
    expect(input.props.numberOfLines).toBe(EDIT_ITEM_NAME_LINES);
    expect(input.props.textAlignVertical).toBe('top');
  });

  it('ItemAmountField renders the amount placeholder and forwards typing', async () => {
    const onChangeText = vi.fn();
    const view = await render(<ItemAmountField value="" onChangeText={onChangeText} style={{}} />);

    const input = view.getByLabelText('Amount');
    expect(input.props.placeholder).toBe('Amount');
    fireEvent.changeText(input, '1.50');
    expect(onChangeText).toHaveBeenCalledWith('1.50');
  });

  it('ItemQuantityField renders the value and steps through the labels', async () => {
    const onChange = vi.fn();
    const view = await render(<ItemQuantityField value={2} onChange={onChange} />);

    expect(view.getByLabelText('Quantity: 2')).toBeTruthy();
    fireEvent.press(view.getByLabelText('Quantity +'));
    expect(onChange).toHaveBeenCalledWith(3);
    fireEvent.press(view.getByLabelText('Quantity -'));
    expect(onChange).toHaveBeenCalledWith(1);
  });
});
