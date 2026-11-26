import { beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react-native';
import CharCounter from '../../src/components/CharCounter';
import { resetStub } from '../helpers/configStub';
import { darkColors } from '../../src/constants/themes';

function flattenStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return style.reduce((acc: Record<string, unknown>, item) => ({ ...acc, ...flattenStyle(item) }), {});
  }
  return (style ?? {}) as Record<string, unknown>;
}

describe('CharCounter', () => {
  beforeEach(() => {
    resetStub();
  });

  it('renders the count and stays muted below the limit', async () => {
    const view = await render(<CharCounter current={3} max={100} />);

    const styles = flattenStyle(view.getByText('3/100').props.style);
    expect(styles.color).toBe(darkColors.textSecondary);
    expect(styles.fontWeight).toBe('500');
  });

  it('turns red and bold exactly at the limit', async () => {
    const view = await render(<CharCounter current={100} max={100} />);

    const styles = flattenStyle(view.getByText('100/100').props.style);
    expect(styles.color).toBe(darkColors.red);
    expect(styles.fontWeight).toBe('700');
  });

  it('also flags a value over the limit', async () => {
    const view = await render(<CharCounter current={101} max={100} />);

    const styles = flattenStyle(view.getByText('101/100').props.style);
    expect(styles.color).toBe(darkColors.red);
    expect(styles.fontWeight).toBe('700');
  });
});
