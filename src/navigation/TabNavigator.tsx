import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text, View, StyleSheet, TouchableOpacity} from 'react-native';
import {colors} from '@/theme';
import type {TabParamList} from './routes';
import DashboardScreen from '@/screens/DashboardScreen';
import SearchScreen from '@/screens/SearchScreen';
import RecapScreen from '@/screens/RecapScreen';

const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({
  focused,
  label,
}: {
  focused: boolean;
  label: string;
}) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} label="Home" />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} label="Search" />
          ),
        }}
      />
      <Tab.Screen
        name="Recap"
        component={RecapScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} label="Recap" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surfaceContainerLow,
    borderTopWidth: 0,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tabIconActive: {
    backgroundColor: colors.primaryContainer,
  },
  tabLabel: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    fontFamily: 'Inter-Regular',
  },
  tabLabelActive: {
    color: colors.onPrimaryContainer,
  },
});
