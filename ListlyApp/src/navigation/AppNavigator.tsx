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
import { t } from '../i18n';
import type { RootStackParamList, IconName } from '../constants/types';
import HomeScreen from '../screens/HomeScreen';
import ListDetailScreen from '../screens/ListDetailScreen';
import CreateListScreen from '../screens/CreateListScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DrawerMenuButton from '../components/DrawerMenuButton';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();

let _stackNav: NativeStackNavigationProp<RootStackParamList> | null = null;

type ScreenDef = {
  name: keyof RootStackParamList;
  component: ComponentType;
  title: string;
  headerLeft?: boolean;
};

const HeaderTitle = memo(function HeaderTitle({ title }: { title: string }) {
  const fs = useFontSize();
  const { activeColors: c } = useConfig();
  return <Text style={[styles.headerTitleText, { color: c.text, fontSize: fs(17) }]}>{title}</Text>;
});

const StackHeaderLeft = memo(function StackHeaderLeft() {
  const labels = t();
  return <DrawerMenuButton accessibilityLabel={labels.home_open_menu} />;
});

type DrawerScreenName = 'Home' | 'Lists' | 'Settings';

type DrawerItemDef = {
  label: string;
  icon: IconName;
  screen: DrawerScreenName;
};

const ROOT_DRAWER_SCREENS: DrawerScreenName[] = ['Home', 'Lists'];

function openDrawerScreen(navigation: DrawerContentComponentProps['navigation'], screen: DrawerScreenName) {
  if (ROOT_DRAWER_SCREENS.includes(screen)) {
    if (_stackNav) {
      _stackNav.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home' }],
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
  const labels = t();

  const drawerItems: DrawerItemDef[] = [
    { label: labels.nav_home, icon: 'home-outline', screen: 'Home' },
    { label: labels.nav_lists, icon: 'list-outline', screen: 'Lists' },
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
        {drawerItems.map(item => (
          <DrawerItem
            key={item.screen}
            label={item.label}
            onPress={() => openDrawerScreen(props.navigation, item.screen)}
            icon={({ color, size }) => <Ionicons name={item.icon} size={size} color={color} />}
            labelStyle={{ color: c.text, fontSize: fs(14) }}
            inactiveTintColor={c.primary}
          />
        ))}
      </DrawerContentScrollView>
    </View>
  );
}

function HomeNavCapture() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  useEffect(() => { _stackNav = navigation; }, [navigation]);
  return <HomeScreen />;
}

const HomeStack = memo(function HomeStack() {
  const { activeColors: c } = useConfig();
  const labels = t();

  const screenOptions = useMemo(() => ({
    headerStyle: { backgroundColor: c.surface },
    headerTintColor: c.text,
    headerTitleAlign: 'center' as const,
  }), [c.surface, c.text]);

  const screens = useMemo<ScreenDef[]>(() => [
    { name: 'Home', component: HomeNavCapture, title: labels.app_name, headerLeft: true },
    { name: 'ListDetail', component: ListDetailScreen, title: labels.app_name },
    { name: 'CreateList', component: CreateListScreen, title: labels.app_name },
    { name: 'Settings', component: SettingsScreen, title: labels.settings_title },
  ], [labels]);

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {screens.map(({ name, component, title, headerLeft }) => (
        <Stack.Screen
          key={name}
          name={name}
          component={component}
          options={{
            headerTitle: () => <HeaderTitle title={title} />,
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
        options={{ headerShown: false, drawerLabel: t().nav_home }}
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
  headerTitleText: {
    fontWeight: '600',
  },
});