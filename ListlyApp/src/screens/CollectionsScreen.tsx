import { LIST_VIEW_MODES } from '../constants/types';
import ListsScreenBase from './ListsScreenBase';

export default function CollectionsScreen() {
  return <ListsScreenBase listsLayoutKey="collectionsLayout" collectionsLayoutKey="collectionsLayout" mode={LIST_VIEW_MODES.collections} />;
}