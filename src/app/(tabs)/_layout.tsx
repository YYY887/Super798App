import { Redirect } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

import { useAuth } from '../../context/AuthContext';

export default function TabsLayout() {
  const { bootstrapped, token } = useAuth();

  if (!bootstrapped) return null;
  if (!token) return <Redirect href="/login" />;

  return (
    <NativeTabs
      labelStyle={{ color: '#8a8a8f' }}
      iconColor={{ default: '#9a9aa0', selected: '#5f5f64' }}
      tintColor="#5f5f64"
      backgroundColor="rgba(255,255,255,0.9)"
      shadowColor="transparent"
      blurEffect="systemUltraThinMaterialLight"
      disableTransparentOnScrollEdge
      minimizeBehavior="onScrollDown"
    >
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'drop', selected: 'drop.fill' }} />
        <Label>设备</Label>
        <NativeTabs.Trigger.TabBar backgroundColor="rgba(255,255,255,0.01)" shadowColor="transparent" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="records">
        <Icon sf={{ default: 'clock', selected: 'clock.fill' }} />
        <Label>记录</Label>
        <NativeTabs.Trigger.TabBar backgroundColor="rgba(255,255,255,0.01)" shadowColor="transparent" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>我的</Label>
        <NativeTabs.Trigger.TabBar backgroundColor="rgba(255,255,255,0.01)" shadowColor="transparent" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
