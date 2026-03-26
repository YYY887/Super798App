import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STARTUP_PROBE_MODE = true;

/*
 * 2026-03-26:
 * 当前侧载/TrollStore 环境存在“启动后立刻闪退”的问题。
 * 这里先把启动路径压到最小，只保留静态安全页，用来快速判断：
 * 1. 如果这个探针包能打开，说明签名/打包基本没问题，崩溃点在业务启动链。
 * 2. 如果这个探针包仍然闪退，说明问题更偏向原生包/签名环境，而不是页面代码。
 * 排查完成后要把这个开关关掉，再逐步恢复 AuthProvider / AppDataProvider / Tabs。
 */
export default function Layout() {
  if (STARTUP_PROBE_MODE) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.title}>Super798</Text>
          <Text style={styles.subtitle}>启动探针页</Text>
          <Text style={styles.hint}>如果你能看到这个页面，说明闪退不在最外层启动壳。</Text>
        </View>
      </SafeAreaView>
    );
  }

  return null;
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
