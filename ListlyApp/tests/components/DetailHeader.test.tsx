import { describe, expect, it, beforeEach } from 'vitest';
import { render } from '@testing-library/react-native';
import DetailHeader from '../../src/components/DetailHeader';
import { resetStub } from '../helpers/configStub';

function renderHeader(overrides: Partial<Parameters<typeof DetailHeader>[0]> = {}) {
  const props = {
    icon: 'cart-outline' as const,
    color: '#22D3EE',
    name: 'Groceries',
    progressLabel: '2/5',
    onEdit: () => {},
    editAccessibilityLabel: 'Edit list',
    progressPercent: 40,
    ...overrides,
  };
  return render(<DetailHeader {...props} />);
}

describe('DetailHeader', () => {
  beforeEach(() => resetStub());

  it('renders the item progress bar without a value bar on standard lists', async () => {
    const view = await renderHeader();
    expect(view.getByText('2/5')).toBeTruthy();
    expect(view.queryByText('3.20 / 22.93')).toBeNull();
    expect(view.queryByTestId('value-bar-slot')).toBeNull();
  });

  it('renders the value bar with done/total numbers and a percentage', async () => {
    const view = await renderHeader({
      totals: { all: 2293, done: 320 },
      valueProgress: { percent: 13.956, doneText: '3.20', totalText: '22.93' },
    });
    expect(view.getByText('3.20 / 22.93')).toBeTruthy();
    expect(view.getByText('13.96 %')).toBeTruthy();
    expect(view.getByLabelText('Value progress: 13.96 %')).toBeTruthy();
  });

  it('reserves the value-bar slot (no numbers) when totals exist but the bar is hidden', async () => {
    const view = await renderHeader({ totals: { all: 2293, done: 0 } });
    expect(view.queryByText('3.20 / 22.93')).toBeNull();
    // the reserved slot keeps the header height stable
    expect(view.getByTestId('value-bar-slot')).toBeTruthy();
  });
});
