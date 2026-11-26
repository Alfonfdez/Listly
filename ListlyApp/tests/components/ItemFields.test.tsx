import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react-native';
import { resetStub } from '../helpers/configStub';
import {
  ItemAmountField,
  ItemLineTotal,
  ItemNameField,
  ItemNoteField,
  ItemQuantityField,
} from '../../src/components/ItemFields';

describe('ItemFields', () => {
  beforeEach(() => resetStub());

  it('ItemLineTotal formats amount × quantity and exposes the labelled total', async () => {
    const view = await render(<ItemLineTotal amountMinor={250} quantity={3} fontSize={14} />);

    expect(view.getByText('7.50')).toBeTruthy();
    expect(view.getByLabelText('Total: 7.50')).toBeTruthy();
  });

  it('ItemNoteField renders the counter and forwards typing', async () => {
    const onChangeText = vi.fn();
    const view = await render(<ItemNoteField value="whole" onChangeText={onChangeText} style={{}} />);

    expect(view.getByText('5/2000')).toBeTruthy();
    fireEvent.changeText(view.getByLabelText('Note'), 'skim');
    expect(onChangeText).toHaveBeenCalledWith('skim');
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
      />
    );

    expect(view.getByText('4/200')).toBeTruthy();
    fireEvent.changeText(view.getByLabelText('Add an item...'), 'Bread');
    expect(onChangeText).toHaveBeenCalledWith('Bread');
  });

  it('ItemNameField supports a two-line multiline name (edit modal)', async () => {
    const view = await render(
      <ItemNameField
        value="A long item name"
        onChangeText={() => {}}
        placeholder="Name"
        accessibilityLabel="Name"
        style={{}}
        multiline
      />
    );

    const input = view.getByLabelText('Name');
    expect(input.props.multiline).toBe(true);
    expect(input.props.numberOfLines).toBe(2);
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
