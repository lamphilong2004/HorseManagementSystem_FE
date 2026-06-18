import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ThemeProvider, useThemeMode } from "./src/context/ThemeContext";
import { WalletProvider, useWallet } from "./src/context/WalletContext";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import HomeScreen from "./src/screens/HomeScreen";
import RefereeReportScreen from "./src/screens/RefereeReportScreen";
import {
  AdminSchedulingScreen,
  AdminUsersScreen,
  HorsesScreen,
  InvitesScreen,
  JockeyScheduleScreen,
  LeaderboardScreen,
  NotificationsScreen,
  PlacePredictionScreen,
  PredictionsScreen,
  RaceResultsScreen,
  RacesScreen,
  RefereeRacesScreen,
  TournamentsScreen
} from "./src/screens/FeatureScreens";
import { AppAlertHost } from "./src/ui/components";
import { colorsForMode } from "./src/ui/theme";

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { session, booted } = useAuth();
  const { isDark } = useThemeMode();
  const colors = colorsForMode(isDark);

  if (!booted) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.bg,
          card: colors.bg,
          text: colors.text,
          border: colors.border,
          primary: colors.primary
        }
      }}
    >
      <StatusBar style={isDark ? "light" : "dark"} translucent backgroundColor="transparent" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Tournaments" component={TournamentsRoute} />
            <Stack.Screen name="Races" component={RacesRoute} />
            <Stack.Screen name="Horses" component={HorsesRoute} />
            <Stack.Screen name="Invites" component={InvitesRoute} />
            <Stack.Screen name="Predictions" component={PredictionsRoute} />
            <Stack.Screen name="PlacePrediction" component={PlacePredictionRoute} />
            <Stack.Screen name="RaceResults" component={RaceResultsRoute} />
            <Stack.Screen name="Notifications" component={NotificationsRoute} />
            <Stack.Screen name="Leaderboard" component={LeaderboardRoute} />
            <Stack.Screen name="AdminUsers" component={AdminUsersRoute} />
            <Stack.Screen name="AdminScheduling" component={AdminSchedulingRoute} />
            <Stack.Screen name="RefereeRaces" component={RefereeRacesRoute} />
            <Stack.Screen name="JockeySchedule" component={JockeyScheduleRoute} />
            <Stack.Screen name="RefereeReport" component={RefereeReportScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function TournamentsRoute() {
  const { apiService } = useAuth();
  return <TournamentsScreen api={apiService} />;
}

function RacesRoute() {
  const { apiService } = useAuth();
  return <RacesScreen api={apiService} />;
}

function HorsesRoute() {
  const { apiService } = useAuth();
  return <HorsesScreen api={apiService} />;
}

function InvitesRoute() {
  const { apiService } = useAuth();
  return <InvitesScreen api={apiService} />;
}

function PredictionsRoute() {
  const { apiService } = useAuth();
  return <PredictionsScreen api={apiService} />;
}

function PlacePredictionRoute() {
  const { apiService } = useAuth();
  const wallet = useWallet();
  return <PlacePredictionScreen api={apiService} wallet={wallet} />;
}

function RaceResultsRoute() {
  const { apiService } = useAuth();
  return <RaceResultsScreen api={apiService} />;
}

function NotificationsRoute() {
  const { apiService } = useAuth();
  return <NotificationsScreen api={apiService} />;
}

function LeaderboardRoute() {
  const { apiService } = useAuth();
  return <LeaderboardScreen api={apiService} />;
}

function AdminUsersRoute() {
  const { apiService } = useAuth();
  return <AdminUsersScreen api={apiService} />;
}

function AdminSchedulingRoute() {
  const { apiService } = useAuth();
  return <AdminSchedulingScreen api={apiService} />;
}

function RefereeRacesRoute({ navigation }) {
  const { apiService } = useAuth();
  return <RefereeRacesScreen api={apiService} navigation={navigation} />;
}

function JockeyScheduleRoute() {
  const { apiService } = useAuth();
  return <JockeyScheduleScreen api={apiService} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <WalletProvider>
            <RootNavigator />
            <AppAlertHost />
          </WalletProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
