import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function ProbeApp() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.title}>Super798</Text>
          <Text style={styles.subtitle}>Direct Entry Probe</Text>
          <Text style={styles.hint}>如果这页能显示，说明真正卡住的是 expo-router 启动链，不是整个 App 壳。</Text>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f8fc',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    color: '#18314f',
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 18,
    color: '#4f86c6',
    fontWeight: '700',
  },
  hint: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 21,
    color: '#60748a',
    textAlign: 'center',
  },
});
