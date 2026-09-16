import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react-native';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import SelectionCheck from '../../src/components/SelectionCheck';
import { darkColors } from '../../src/constants/themes';

type RenderView = Awaited<ReturnType<typeof render>>;

function rootStyle(view: RenderView): ViewStyle {
  const json = view.toJSON();
  const node = (Array.isArray(json) ? json[0] : json) as {
    props?: { style?: StyleProp<ViewStyle> };
  } | null;
  return StyleSheet.flatten(node?.props?.style ?? []);
}

describe('SelectionCheck', () => {
  it('renders an empty bordered box when unselected', async () => {
    const view = await render(<SelectionCheck selected={false} />);
    expect(view.queryByText('checkmark')).toBeNull();
    const style = rootStyle(view);
    expect(style.borderColor).toBe(darkColors.border);
    expect(style.backgroundColor).toBe('transparent');
  });

  it('renders the checkmark and primary colors when selected', async () => {
    const view = await render(<SelectionCheck selected />);
    expect(view.getByText('checkmark')).toBeTruthy();
    const style = rootStyle(view);
    expect(style.backgroundColor).toBe(darkColors.primary);
    expect(style.borderColor).toBe(darkColors.primary);
  });

  it('uses the provided unselected background', async () => {
    const view = await render(<SelectionCheck selected={false} unselectedBackground="#123456" />);
    expect(rootStyle(view).backgroundColor).toBe('#123456');
  });
});
