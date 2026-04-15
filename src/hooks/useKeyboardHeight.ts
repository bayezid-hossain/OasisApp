import { useState, useEffect } from 'react'
import { Keyboard, Platform } from 'react-native'

/**
 * Returns the current keyboard height (0 when hidden).
 * Use as `paddingBottom` on bottom sheet containers so inputs stay visible.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0)

  useEffect(() => {
    // iOS: use Will events for smooth animation before keyboard fully appears
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

    const showSub = Keyboard.addListener(showEvent, (e) => setHeight(e.endCoordinates.height))
    const hideSub = Keyboard.addListener(hideEvent, () => setHeight(0))

    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  return height
}
