import Constants from 'expo-constants';
import { Platform } from 'react-native';

type WidgetInteractionEvent = {
  source: string;
  target: string;
  timestamp: number;
  type: 'ExpoWidgetsUserInteraction';
};

type WidgetInteractionListener = (event: WidgetInteractionEvent) => void;

export function canUseWidgetRuntime() {
  return Platform.OS === 'ios' && Constants.appOwnership !== 'expo';
}

export function addWidgetInteractionListener(listener: WidgetInteractionListener) {
  if (!canUseWidgetRuntime()) {
    return { remove() {} };
  }

  try {
    const widgetsModule = require('expo-widgets') as {
      addUserInteractionListener: (nextListener: WidgetInteractionListener) => { remove: () => void };
    };

    return widgetsModule.addUserInteractionListener(listener);
  } catch {
    return { remove() {} };
  }
}
