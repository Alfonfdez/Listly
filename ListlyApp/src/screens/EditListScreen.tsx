import { useCallback, useMemo, useState } from 'react';
import { CommonActions, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useLabels } from '../hooks/useLabels';
import { LIST_KINDS, MERGE_NOTICE, type IconName, type ListKind, type NavigationProp, type RootStackParamList } from '../constants/types';
import { listRepo } from '../database';
import type { ListWithCounts } from '../database/types';
import { useMergeFlow } from '../hooks/useMergeFlow';
import { logError, ERROR_SCOPE } from '../utils/errors';
import ScreenShell from '../components/ScreenShell';
import NotFoundScreen from '../components/NotFoundScreen';
import ListForm from '../components/ListForm';
import { type SecondaryAction } from '../components/EntityForm';
import ConfirmModal from '../components/ConfirmModal';
import CollectionSelectRow from '../components/CollectionSelectRow';
import CollectionPickerModal from '../components/CollectionPickerModal';
import ListPickerModal from '../components/ListPickerModal';
import KindSelectRow from '../components/KindSelectRow';

export default function EditListScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'EditList'>>();
  const navigation = useNavigation<NavigationProp<'EditList'>>();
  const { listId } = route.params;
  const { lists, collections, refresh, lockedListIds } = useApp();
  const labels = useLabels();
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  const list = lists.find(l => l.id === listId);
  const locked = lockedListIds.has(listId);
  const initialCollectionId = list?.collection_id ?? null;
  const [collectionId, setCollectionId] = useState<number | null>(() => initialCollectionId);
  const [kind, setKind] = useState<ListKind>(list?.kind ?? LIST_KINDS.standard);

  const hasOtherLists = useMemo(
    () => lists.some(l => l.id !== listId && !lockedListIds.has(l.id)),
    [lists, listId, lockedListIds]
  );
  const canMerge = !!list && !locked && (list.total ?? 0) > 0 && hasOtherLists;

  const {
    mergePickerVisible,
    openMergePicker,
    closeMergePicker,
    mergeTarget,
    setMergeTarget,
    mergeBusy,
    doMerge,
  } = useMergeFlow({
    list,
    refresh,
    onMerged: useCallback(
      (target: ListWithCounts) => {
        navigation.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [
              { name: 'Home' },
              { name: 'ListDetail', params: { listId: target.id, notice: MERGE_NOTICE } },
            ],
          })
        );
      },
      [navigation]
    ),
  });

  const update = useCallback(
    async ({ name, icon, color }: { name: string; icon: IconName; color: string }) => {
      try {
        await listRepo.update(listId, { name, icon, color, kind });
        if (collectionId !== initialCollectionId) {
          if (collectionId === null) {
            await listRepo.removeFromCollection(listId);
          } else {
            await listRepo.moveToCollection(listId, collectionId);
          }
        }
        await refresh();
        navigation.goBack();
      } catch (error) {
        logError(ERROR_SCOPE.moveList, error);
      }
    },
    [listId, initialCollectionId, collectionId, kind, refresh, navigation]
  );

  const remove = useCallback(async () => {
    try {
      await listRepo.delete(listId);
      await refresh();
      navigation.popToTop();
    } catch (error) {
      logError(ERROR_SCOPE.deleteList, error);
      setDeleteVisible(false);
    }
  }, [listId, refresh, navigation]);

  const secondaryActions: SecondaryAction[] = [];
  if (canMerge) {
    secondaryActions.push({
      key: 'merge',
      label: labels.list_merge_into,
      onPress: openMergePicker,
      tone: 'warning',
    });
  }
  if (!locked) {
    secondaryActions.push({
      key: 'duplicate',
      label: labels.list_duplicate,
      onPress: () => navigation.navigate('CreateList', { duplicateFromListId: listId }),
      tone: 'primary',
    });
  }

  if (!list) {
    return <NotFoundScreen />;
  }

  return (
    <ScreenShell>
      <ListForm
        initialName={list.name}
        initialIcon={list.icon as IconName}
        initialColor={list.color}
        submitLabel={labels.list_save}
        excludeId={list.id}
        deleteLabel={labels.list_delete_label}
        onDelete={() => setDeleteVisible(true)}
        secondaryActions={secondaryActions}
        kindSlot={<KindSelectRow kind={kind} onChange={setKind} />}
        fieldSlot={
          <CollectionSelectRow
            label={labels.list_collection_label}
            noneLabel={labels.list_collection_none}
            selectedCollection={collections.find(c => c.id === collectionId) ?? null}
            onPress={() => setPickerVisible(true)}
          />
        }
        onSubmit={update}
      />

      <CollectionPickerModal
        visible={pickerVisible}
        title={labels.list_collection_picker_title}
        options={collections}
        selectedId={collectionId}
        standaloneLabel={labels.list_collection_none}
        cancelLabel={labels.common_cancel}
        onSelect={setCollectionId}
        onClose={() => setPickerVisible(false)}
      />

      <ListPickerModal
        visible={mergePickerVisible}
        title={labels.list_merge_into}
        options={lists}
        excludeListId={listId}
        cancelLabel={labels.common_cancel}
        emptyLabel={labels.list_merge_empty}
        onSelect={setMergeTarget}
        onClose={closeMergePicker}
      />

      <ConfirmModal
        visible={mergeTarget !== null}
        title={labels.list_merge_confirm_title}
        message={
          mergeTarget
            ? labels.list_merge_confirm_message(list.total, mergeTarget.name, list.name)
            : undefined
        }
        cancelLabel={labels.common_cancel}
        confirmLabel={labels.list_merge_confirm}
        onCancel={() => setMergeTarget(null)}
        onConfirm={() => {
          if (mergeTarget) void doMerge(mergeTarget);
        }}
        destructive
        confirmDisabled={mergeBusy}
      />

      <ConfirmModal
        visible={deleteVisible}
        title={labels.list_delete_confirm}
        message={labels.list_delete_message}
        cancelLabel={labels.common_cancel}
        confirmLabel={labels.list_delete_label}
        onCancel={() => setDeleteVisible(false)}
        onConfirm={() => void remove()}
        destructive
      />
    </ScreenShell>
  );
}
