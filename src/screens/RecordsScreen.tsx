import { useEffect } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppData } from '../context/AppDataContext';
import { useTheme } from '../context/ThemeContext';
import { duration, formatLiters, formatName, formatTime } from '../lib/utils';

export function RecordsScreen() {
  const { theme } = useTheme();
  const { account, recordsLoading, records, recordsTotal, refreshRecords } = useAppData();

  useEffect(() => {
    if (!account?.id) return;
    refreshRecords();
  }, [account?.id]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>接水记录</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>这里只保留记录内容，不再上面叠展示卡。</Text>
        </View>

        <Text style={[styles.total, { color: theme.textMuted }]}>共 {recordsTotal} 条</Text>

        {recordsLoading ? (
          <View style={[styles.emptyBlock, { backgroundColor: theme.surfaceSoft, borderColor: theme.borderSoft }]}>
            <ActivityIndicator color="#000000" />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>正在加载记录...</Text>
          </View>
        ) : records.length === 0 ? (
          <View style={[styles.emptyBlock, { backgroundColor: theme.surfaceSoft, borderColor: theme.borderSoft }]}>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>暂无记录</Text>
          </View>
        ) : (
          records.map((record) => (
            <View key={record.id} style={[styles.recordItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.recordMain}>
                <Text style={[styles.recordName, { color: theme.text }]}>{formatName(record.dname || record.did)}</Text>
                {record.ep ? <Text style={[styles.recordMeta, { color: theme.textMuted }]}>{record.ep}</Text> : null}
                <Text style={[styles.recordMeta, { color: theme.textMuted }]}>{formatTime(record.start_at)}</Text>
                {record.end_at ? (
                  <Text style={[styles.recordMeta, { color: theme.textMuted }]}>时长 {duration(record.start_at, record.end_at)}</Text>
                ) : (
                  <Text style={[styles.recordRunning, { color: theme.primary }]}>进行中</Text>
                )}
              </View>
              <View style={styles.recordSide}>
                <Text style={[styles.recordAmount, { color: theme.primary }]}>{formatLiters(record.out_ml)}</Text>
                <Text style={[styles.recordScore, { color: theme.textMuted }]}>积分 {record.score || 0}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f8ff' },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 40, gap: 12 },
  header: { gap: 6, marginBottom: 2 },
  title: { fontSize: 28, color: '#22325c', fontWeight: '800' },
  subtitle: { fontSize: 13, color: '#6f7db4' },
  total: { fontSize: 13, color: '#6f7db4', fontWeight: '700', marginBottom: 2 },
  emptyBlock: {
    borderRadius: 22,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#dde3ff',
    paddingVertical: 28,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: { color: '#6f7db4', fontSize: 14 },
  recordItem: {
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e8ff',
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  recordMain: { flex: 1, gap: 4 },
  recordName: { fontSize: 17, color: '#22325c', fontWeight: '800' },
  recordMeta: { fontSize: 12, color: '#6f7db4' },
  recordRunning: { fontSize: 12, color: '#4d63df', fontWeight: '700' },
  recordSide: { alignItems: 'flex-end', gap: 4 },
  recordAmount: { fontSize: 20, color: '#4d63df', fontWeight: '800' },
  recordScore: { fontSize: 12, color: '#6f7db4' },
});
