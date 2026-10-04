import { describe, expect, it, beforeEach } from 'vitest';
import { render } from '@testing-library/react-native';
import { resetStub } from '../helpers/configStub';
import TypeBadge from '../../src/components/TypeBadge';

describe('TypeBadge', () => {
  beforeEach(() => {
    resetStub();
  });

  it('renders the collection icon for collections', async () => {
    const view = await render(<TypeBadge type="collection" />);
    expect(view.getByText('albums-outline')).toBeTruthy();
  });

  it('renders the list icon for lists', async () => {
    const view = await render(<TypeBadge type="list" />);
    expect(view.getByText('list-outline')).toBeTruthy();
  });
});
