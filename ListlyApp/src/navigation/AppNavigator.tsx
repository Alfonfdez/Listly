import { Text, View, StyleSheet } from 'react-native';
import { memo, useEffect, useMemo, type ComponentType } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer, useNavigation, CommonActions } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import type { RootStackParamList, IconName } from '../constants/types';
import { ICONS } from '../constants/icons';
import HomeScreen from '../screens/HomeScreen';
import ListsScreen from '../screens/ListsScreen';
import CollectionsScreen from '../screens/CollectionsScreen';
import ListDetailScreen from '../screens/ListDetailScreen';
import CreateListScreen from '../screens/CreateListScreen';
import EditListScreen from '../screens/EditListScreen';
import CreateCollectionScreen from '../screens/CreateCollectionScreen';
import EditCollectionScreen from '../screens/EditCollectionScreen';
import CollectionDetailScreen from '../screens/CollectionDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AppearanceScreen from '../screens/settings/AppearanceScreen';
import RegionalScreen from '../screens/settings/RegionalScreen';
import PersonalizationScreen from '../screens/settings/PersonalizationScreen';
import DataScreen from '../screens/settings/DataScreen';
import DrawerMenuButton from '../components/DrawerMenuButton';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();

let _stackNav: NativeStackNavigationProp<RootStackParamList> | null = null;

type ScreenDef = {
  name: keyof RootStackParamList;
  component: ComponentType;
  title: string;
  icon: IconName;
  headerLeft?: boolean;
};

const HeaderTitle = memo(function HeaderTitle({ icon, title }: { icon?: IconName; title: string }) {
  const fs = useFontSize();
  const { activeColors: c } = useConfig();
  return (
    <View style={styles.headerTitleRow}>
      {icon ? <Ionicons name={icon} size={20} color={c.text} /> : null}
      <Text style={[styles.headerTitleText, { color: c.text, fontSize: fs(17) }]}>{title}</Text>
    </View>
  );
});

const StackHeaderLeft = memo(function StackHeaderLeft() {
  const labels = useLabels();
  return <DrawerMenuButton accessibilityLabel={labels.home_open_menu} />;
});

type DrawerScreenName = 'Home' | 'Lists' | 'Collections' | 'Settings';

type DrawerItemDef =
  | { label: string; icon: IconName; screen: DrawerScreenName }
  | { separator: true };

function openDrawerScreen(navigation: DrawerContentComponentProps['navigation'], screen: DrawerScreenName) {
  if (screen === 'Home' || screen === 'Lists' || screen === 'Collections') {
    if (_stackNav) {
      _stackNav.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: screen }],
        })
      );
    }
  } else {
    navigation.navigate('Main', { screen });
  }
  navigation.closeDrawer();
}

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  const drawerItems: DrawerItemDef[] = [
    { label: labels.nav_home, icon: 'home-outline', screen: 'Home' },
    { label: labels.nav_collections, icon: ICONS.collection, screen: 'Collections' },
    { label: labels.nav_lists, icon: ICONS.list, screen: 'Lists' },
    { separator: true },
    { label: labels.nav_settings, icon: 'settings-outline', screen: 'Settings' },
  ];

  return (
    <View style={[styles.drawerContainer, { backgroundColor: c.surface }]}>
      <DrawerContentScrollView {...props} style={{ backgroundColor: c.surface }}>
        <View style={[styles.drawerHeader, { borderBottomColor: c.border }]}>
          <Text style={[styles.drawerTitle, { color: c.primary, fontSize: fs(24) }]}>
            {labels.app_name}
          </Text>
        </View>
        {drawerItems.map((item, index) =>
          'separator' in item ? (
            <View key={`sep-${index}`} style={[styles.separator, { backgroundColor: c.border }]} />
          ) : (
            <DrawerItem
              key={item.screen}
              label={item.label}
              onPress={() => openDrawerScreen(props.navigation, item.screen)}
              icon={({ color, size }) => <Ionicons name={item.icon} size={size} color={color} />}
              labelStyle={{ color: c.text, fontSize: fs(14) }}
              inactiveTintColor={c.primary}
            />
          )
        )}
      </DrawerContentScrollView>
    </View>
  );
}

function HomeNavCapture() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  useEffect(() => { _stackNav = navigation; }, [navigation]);
  return <HomeScreen />;
}

function ListsNavCapture() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  useEffect(() => { _stackNav = navigation; }, [navigation]);
  return <ListsScreen />;
}

function CollectionsNavCapture() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  useEffect(() => { _stackNav = navigation; }, [navigation]);
  return <CollectionsScreen />;
}

const HomeStack = memo(function HomeStack() {
  const { activeColors: c } = useConfig();
  const labels = useLabels();

  const screenOptions = useMemo(() => ({
    headerStyle: { backgroundColor: c.surface },
    headerTintColor: c.text,
    headerTitleAlign: 'center' as const,
  }), [c.surface, c.text]);

  const screens = useMemo<ScreenDef[]>(() => [
    { name: 'Home', component: HomeNavCapture, title: labels.app_name, icon: 'home-outline', headerLeft: true },
    { name: 'Lists', component: ListsNavCapture, title: labels.nav_lists, icon: ICONS.list, headerLeft: true },
    { name: 'Collections', component: CollectionsNavCapture, title: labels.nav_collections, icon: ICONS.collection, headerLeft: true },
    { name: 'ListDetail', component: ListDetailScreen, title: labels.list_detail_title, icon: 'checkbox-outline' },
    { name: 'CreateList', component: CreateListScreen, title: labels.create_list_title, icon: 'add-circle-outline' },
    { name: 'EditList', component: EditListScreen, title: labels.edit_list_title, icon: ICONS.edit },
    { name: 'CollectionDetail', component: CollectionDetailScreen, title: labels.collection_detail_title, icon: ICONS.collection },
    { name: 'CreateCollection', component: CreateCollectionScreen, title: labels.create_collection_title, icon: ICONS.collection },
    { name: 'EditCollection', component: EditCollectionScreen, title: labels.edit_collection_title, icon: ICONS.edit },
    { name: 'Settings', component: SettingsScreen, title: labels.settings_title, icon: 'settings-outline' },
    { name: 'SettingsAppearance', component: AppearanceScreen, title: labels.settings_appearance, icon: 'color-palette-outline' },
    { name: 'SettingsRegional', component: RegionalScreen, title: labels.settings_regional, icon: 'globe-outline' },
    { name: 'SettingsPersonalization', component: PersonalizationScreen, title: labels.settings_personalization, icon: 'options-outline' },
    { name: 'SettingsData', component: DataScreen, title: labels.settings_data, icon: 'server-outline' },
  ], [labels]);

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {screens.map(({ name, component, title, icon, headerLeft }) => (
        <Stack.Screen
          key={name}
          name={name}
          component={component}
          options={{
            headerTitle: () => <HeaderTitle icon={icon} title={title} />,
            ...(headerLeft ? { headerLeft: () => <StackHeaderLeft /> } : {}),
          }}
        />
      ))}
    </Stack.Navigator>
  );
});

function AppDrawer() {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: { backgroundColor: c.surface, width: 260 },
        drawerLabelStyle: { color: c.text, fontSize: fs(16) },
        drawerActiveTintColor: c.primary,
        drawerInactiveTintColor: c.textSecondary,
      }}
    >
      <Drawer.Screen
        name="Main"
        component={HomeStack}
        options={{ headerShown: false, drawerLabel: labels.nav_home }}
      />
    </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <AppDrawer />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: { flex: 1 },
  drawerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  drawerTitle: {
    fontWeight: '700',
  },
  separator: {
    height: 1,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitleText: {
    fontWeight: '600',
  },
});