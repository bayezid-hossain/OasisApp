import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {CompositeScreenProps} from '@react-navigation/native';
import type {StackScreenProps} from '@react-navigation/stack';
import type {TabParamList, RootStackParamList} from '@/navigation/routes';
import {colors, typography, spacing, radius} from '@/theme';
import {ThoughtCard} from '@/components/thoughts/ThoughtCard';
import {useSearchStore} from '@/stores';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Search'>,
  StackScreenProps<RootStackParamList>
>;

export default function SearchScreen({navigation}: Props) {
  const {query, results, isSearching, setQuery, clearSearch} = useSearchStore();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
      </View>

      {/* Borderless search input */}
      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search your thoughts…"
          placeholderTextColor={`${colors.onSurfaceVariant}80`}
          cursorColor={colors.tertiary}
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Text
            style={styles.clearBtn}
            onPress={clearSearch}>
            ✕
          </Text>
        )}
      </View>

      {isSearching ? (
        <ActivityIndicator
          color={colors.tertiary}
          style={{marginTop: spacing['3xl']}}
        />
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={n => n.id}
          renderItem={({item}) => (
            <ThoughtCard
              note={item}
              onPress={() =>
                navigation.navigate('ThoughtDetail', {noteId: item.id})
              }
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : query.length > 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No thoughts match "{query}"</Text>
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Type to search your thoughts</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.headlineSm,
    color: colors.onSurface,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing['2xl'],
    marginBottom: spacing.xl,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchIcon: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    ...typography.bodyLg,
    color: colors.onSurface,
    padding: 0,
  },
  clearBtn: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    paddingHorizontal: spacing.xs,
  },
  list: {
    paddingHorizontal: spacing['2xl'],
    gap: spacing.base,
    paddingBottom: spacing['4xl'],
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  emptyText: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    opacity: 0.6,
  },
});
