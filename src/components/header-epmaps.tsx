import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NetworkStatusBar } from '@/components/network-status-bar';

// Encabezado institucional: barra de red (R9) + logo y marca EPMAPS.
export function HeaderEpmaps({ subtitulo = 'Lecturas de campo' }: { subtitulo?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <NetworkStatusBar />
      <View style={styles.brandRow}>
        <View style={styles.logoChip}>
          <Image
            resizeMode="contain"
            source={require('../../assets/images/EPMAPS.jpeg')}
            style={styles.logo}
          />
        </View>
        <View>
          <Text style={styles.brand}>EPMAPS</Text>
          <Text style={styles.subtitle}>{subtitulo}</Text>
        </View>
      </View>
      <View style={styles.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#004B87',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingBottom: 14,
    elevation: 4,
    shadowColor: '#004B87',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingTop: 12,
  },
  logoChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logo: { width: 96, height: 44 },
  brand: {
    fontFamily: 'Roboto_700Bold',
    fontSize: 26,
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  subtitle: {
    fontFamily: 'Roboto_500Medium',
    fontSize: 12,
    color: '#7DD3FC',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  accent: {
    height: 3,
    width: 56,
    borderRadius: 2,
    backgroundColor: '#00A3E0',
    alignSelf: 'center',
    marginTop: 12,
  },
});
