import {useEffect, useState} from 'react';
import {Keyboard, KeyboardEvent} from 'react-native';

export function useKeyboardVisible() {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Keyboard.addListener('keyboardDidShow', (e: KeyboardEvent) => {
      setKeyboardVisible(true);
    });
    const hideEvent = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showEvent.remove();
      hideEvent.remove();
    };
  }, []);

  return isKeyboardVisible;
}
