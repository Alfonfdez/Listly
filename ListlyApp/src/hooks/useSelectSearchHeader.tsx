import { useCallback, useEffect } from 'react';
import SelectSearchHeader from '../components/SelectSearchHeader';

interface Options {
  navigation: { setOptions: (options: { headerRight?: () => React.ReactElement }) => void };
  searchActive: boolean;
  onSearchClose: () => void;
  onSearchToggle: () => void;
  selectMode: boolean;
  visible: boolean;
  showSelect: boolean;
  showSearch?: boolean;
  onToggleSelect: () => void;
}

export function useSelectSearchHeader({
  navigation,
  searchActive,
  onSearchClose,
  onSearchToggle,
  selectMode,
  visible,
  showSelect,
  showSearch = true,
  onToggleSelect,
}: Options): { toggleSearch: () => void } {
  const toggleSearch = useCallback(() => {
    if (selectMode) return;
    if (searchActive) onSearchClose();
    else onSearchToggle();
  }, [searchActive, selectMode, onSearchClose, onSearchToggle]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: visible
        ? () => (
            <SelectSearchHeader
              selectMode={selectMode}
              showSelect={showSelect}
              showSearch={showSearch}
              searchActive={searchActive}
              onToggleSelect={onToggleSelect}
              onToggleSearch={toggleSearch}
            />
          )
        : undefined,
    });
  }, [navigation, visible, selectMode, showSelect, showSearch, searchActive, onToggleSelect, toggleSearch]);

  useEffect(() => {
    return () => {
      navigation.setOptions({ headerRight: undefined });
    };
  }, [navigation]);

  return { toggleSearch };
}
