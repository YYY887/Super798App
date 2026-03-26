import { Button, HStack, Text, VStack } from '@expo/ui/swift-ui';
import { createWidget } from 'expo-widgets';

type QuickDeviceWidgetProps = {
  enabled: boolean;
  accountName: string;
  deviceName: string;
  statusText: string;
};

const QuickDeviceWidget = (props: QuickDeviceWidgetProps) => {
  'widget';

  if (!props.enabled) {
    return (
      <VStack>
        <Text>Super798</Text>
        <Text>请在设置里启用小组件</Text>
      </VStack>
    );
  }

  return (
    <VStack>
      <Text>{props.accountName || 'Super798'}</Text>
      <Text>{props.deviceName || '未选择设备'}</Text>
      <Text>{props.statusText || '待开始'}</Text>
      <HStack>
        <Button label="开始" target="start-water" />
        <Button label="结束" target="stop-water" />
      </HStack>
    </VStack>
  );
};

const Widget = createWidget<QuickDeviceWidgetProps>('QuickDeviceWidget', QuickDeviceWidget);

export default Widget;
