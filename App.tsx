import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AudioPlayerProvider } from './src/hooks/useAudioPlayer';
import { initAuth, onAuthStateChange, UserSession } from './src/services/auth';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';

// Écrans
import { LoginScreen } from './src/screens/LoginScreen';
import { MoodSelectorScreen } from './src/screens/MoodSelectorScreen';
import { PlaylistScreen } from './src/screens/PlaylistScreen';
import { FavoritesScreen } from './src/screens/FavoritesScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

// Composants
import { MiniPlayer } from './src/components/MiniPlayer';
import { PixelMusicIcon, PixelBookIcon, PixelChatIcon, PixelUserIcon } from './src/components/PixelIcons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Palette VibeCheck
const C = {
  CREAM: '#F1F1D3',
  SAGE_LIGHT: '#E3EBD0',
  SAGE_MID: '#C7DDC5',
  SAGE_DARK: '#9FCDA8',
  TEAL: '#7DC2A5',
  INK: '#2D3B2D',
  INK_LIGHT: '#5A6B5A',
};

// Thème navigation naturel crème/vert
const VibeTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: C.CREAM,
    card: C.SAGE_LIGHT,
    text: C.INK,
    border: C.SAGE_MID,
    primary: C.TEAL,
    notification: C.SAGE_DARK,
  },
};

// Stack pour l'onglet principal "Home" (MoodSelector → Playlist)
const HomeStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: C.CREAM },
      }}
    >
      <Stack.Screen name="MoodSelector" component={MoodSelectorScreen} />
      <Stack.Screen name="Playlist" component={PlaylistScreen} />
    </Stack.Navigator>
  );
};

// Menu de Navigation Principal par Onglets
const AppTabs: React.FC = () => {
  return (
    <View style={{ flex: 1, backgroundColor: C.CREAM }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: C.SAGE_LIGHT,
            borderTopColor: C.SAGE_MID,
            borderTopWidth: 2,
            height: 66,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: C.TEAL,
          tabBarInactiveTintColor: C.INK_LIGHT,
          tabBarIcon: ({ color, size }) => {
            const s = size - 4;
            if (route.name === 'HomeTab') {
              return <PixelMusicIcon color={color} size={s} />;
            } else if (route.name === 'Favorites') {
              return <PixelBookIcon color={color} size={s} />;
            } else if (route.name === 'History') {
              return <PixelChatIcon color={color} size={s} />;
            } else if (route.name === 'Profile') {
              return <PixelUserIcon color={color} size={s} />;
            }
            return null;
          },
          tabBarLabelStyle: {
            fontSize: 7,
            fontFamily: 'PressStart2P-Regular',
            marginTop: 2,
          },
        })}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeStack}
          options={{ title: 'VIBES' }}
        />
        <Tab.Screen
          name="Favorites"
          component={FavoritesScreen}
          options={{ title: 'FAVORIS' }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: 'SUIVI' }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'PROFIL' }}
        />
      </Tab.Navigator>

      {/* Lecteur Audio Flottant Sticky visible sur tous les onglets */}
      <MiniPlayer />
    </View>
  );
};

export default function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Charger les polices Press Start 2P et Prophecy
  const [fontsLoaded] = useFonts({
    'PressStart2P-Regular': PressStart2P_400Regular,
    'Prophecy': require('./src/assets/fonts/Prophecy.ttf'),
  });

  const isFirstLoad = React.useRef(true);

  useEffect(() => {
    const setupAuth = async () => {
      const initialUser = await initAuth();
      setUser(initialUser);
      setInitializing(false);
      setTimeout(() => {
        isFirstLoad.current = false;
      }, 500);
    };

    setupAuth();

    const unsubscribe = onAuthStateChange((session) => {
      if (isFirstLoad.current) return;
      if (session) {
        setTimeout(() => {
          setUser(session);
        }, 800);
      } else {
        setUser(session);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (initializing || !fontsLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={C.TEAL} />
      </View>
    );
  }

  return (
    <AudioPlayerProvider>
      <NavigationContainer theme={VibeTheme}>
        <StatusBar barStyle="dark-content" backgroundColor={C.CREAM} />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <Stack.Screen name="MainTabs" component={AppTabs} />
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AudioPlayerProvider>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    backgroundColor: '#F1F1D3',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
