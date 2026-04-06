import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import type {RootStackParamList} from './routes';
import {TabNavigator} from './TabNavigator';
import ThoughtDetailScreen from '@/screens/ThoughtDetailScreen';
import CaptureOverlay from '@/screens/CaptureOverlay';

const Stack = createStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen
          name="ThoughtDetail"
          component={ThoughtDetailScreen}
          options={{
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="CaptureOverlay"
          component={CaptureOverlay}
          options={{
            presentation: 'transparentModal',
            cardStyle: {backgroundColor: 'transparent'},
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
