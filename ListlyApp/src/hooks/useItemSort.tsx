import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useLabels } from './useLabels';
import {
  DEFAULT_ITEM_SORT,
  itemSortValue,
  parseItemSortValue,
  sortItems,
  type ItemSort,
  type ItemSortValue,
  type SortDirection,
} from '../utils/itemSort';
import type { IconName } from '../constants/types';
import type { Item } from '../database/types';
import type { Option } from '../components/settings/SelectorInline';

interface Options {
  filteredItems: Item[];
  dragItems: Item[];
}

export function useItemSort({ filteredItems, dragItems }: Options) {
  const { activeColors: c } = useConfig();
  const labels = useLabels();
  const [sort, setSort] = useState<ItemSort>(DEFAULT_ITEM_SORT);
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const sortActive = sort.key !== 'manual';
  const displayItems = useMemo(
    () => (sortActive ? sortItems(filteredItems, sort) : dragItems),
    [sortActive, sort, filteredItems, dragItems]
  );

  const sortOptions = useMemo<Option<ItemSortValue>[]>(() => {
    const directionIcon = (direction: SortDirection) => (
      <Ionicons name={direction === 'asc' ? 'arrow-up' : 'arrow-down'} size={16} color={c.primary} />
    );
    const modeIcon = (name: IconName) => <Ionicons name={name} size={16} color={c.primary} />;
    return [
      { value: 'manual', label: labels.item_sort_manual, icon: modeIcon('swap-vertical') },
      { value: 'name-asc', label: `${labels.item_sort_name} ${labels.item_sort_asc}`, icon: directionIcon('asc') },
      { value: 'name-desc', label: `${labels.item_sort_name} ${labels.item_sort_desc}`, icon: directionIcon('desc') },
      { value: 'created-asc', label: `${labels.item_sort_created} ${labels.item_sort_asc}`, icon: directionIcon('asc') },
      { value: 'created-desc', label: `${labels.item_sort_created} ${labels.item_sort_desc}`, icon: directionIcon('desc') },
    ];
  }, [c, labels]);

  const sortModeLabel =
    sort.key === 'manual' ? labels.item_sort_manual : sort.key === 'name' ? labels.item_sort_name : labels.item_sort_created;
  const sortLabel = sortActive
    ? `${labels.item_sort}: ${sortModeLabel} ${sort.direction === 'asc' ? labels.item_sort_asc : labels.item_sort_desc}`
    : `${labels.item_sort}: ${labels.item_sort_manual}`;

  return {
    sort,
    sortValue: itemSortValue(sort),
    sortDirection: sort.direction,
    selectSort: (value: ItemSortValue) => setSort(parseItemSortValue(value)),
    sortModalVisible,
    openSortModal: () => setSortModalVisible(true),
    closeSortModal: () => setSortModalVisible(false),
    sortActive,
    displayItems,
    sortOptions,
    sortModeLabel,
    sortLabel,
  };
}
