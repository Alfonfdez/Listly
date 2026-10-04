import { LIST_VIEW_MODES } from '../constants/types';
import ListsScreenBase from './ListsScreenBase';

export default function HomeScreen() {
  return <ListsScreenBase listsLayoutKey="homeListsLayout" collectionsLayoutKey="homeCollectionsLayout" mode={LIST_VIEW_MODES.home} />;
}