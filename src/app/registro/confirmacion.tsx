import { useQueryClient } from '@tanstack/react-query';
    import { CameraView, useCameraPermissions } from 'expo-camera';
    import { useRouter } from 'expo-router';
    import { useRef, useState } from 'react';
    import {
      ActivityIndicator,
      Alert,
      Image,
      Pressable,
      ScrollView,
      StyleSheet,
      Text,
      View,
    } from 'react-native';
    import { SafeAreaView } from 'react-native-safe-area-context';
    
    import { BotonCancelarRegistro } from '@/components/boton-cancelar-registro';
    import { HeaderEpmaps } from '@/components/header-epmaps';
    import { calcularConsumo } from '@/features/lecturas/calculoConsumo';
    import { guardarLecturaLocal } from '@/features/lecturas/lecturas.service';
    import { useLecturaStore } from '@/features/lecturas/useLecturaStore';
    import { medidorQueryKey, useMedidorQuery } from '@/features/medidores/useMedidorQuery';
    import { sincronizarSiHayRed } from '@/features/sync/sync.service';
    import { guardarFotoPermanente } from '@/utils/fileSystemStorage';
    
    const PALETTE = {
      primary: '#004B87',
      secondary: '#0076C6',
      bg: '#F8FAFC',
      card: '#FFFFFF',
      cardSecondary: '#F1F5F9',
      border: '#E2E8F0',
      textDark: '#1E293B',
      textMuted: '#64748B',
      btnBackBg: '#F1F5F9',
      badgeNormalBg: '#E0F2FE',
      badgeNormalText: '#0076C6',
      badgeInaccesibleBg: '#FEF3C7',
      badgeInaccesibleText: '#D97706',
      badgeDanadoBg: '#FEF2F2',
      badgeDanadoText: '#DC2626',
    };
    
    const ETIQUETAS_ESTADO = {
      normal: { texto: 'NORMAL', bg: PALETTE.badgeNormalBg, color: PALETTE.badgeNormalText },
      inaccesible: { texto: 'INACCESIBLE', bg: PALETTE.badgeInaccesibleBg, color: PALETTE.badgeInaccesibleText },
      danado: { texto: 'DAÑADO', bg: PALETTE.badgeDanadoBg, color: PALETTE.badgeDanadoText },
    } as const;
    
    /** Botón estilizado de retorno prominente */
    function BotonVolver({ onPress, label = 'Volver' }: { onPress: () => void; label?: string }) {
      return (
        <Pressable
          style={({ pressed }) => [styles.btnVolver, pressed && styles.btnVolverPressed]}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={label}>
          <Text style={styles.btnVolverIcon}>‹</Text>
          <Text style={styles.btnVolverText}>{label}</Text>
        </Pressable>
      );
    }
    
    export default function ConfirmacionScreen() {
      const router = useRouter();
      const queryClient = useQueryClient();
      const datos = useLecturaStore();
      const { data: medidor } = useMedidorQuery(datos.medidorCodigo || null);
      const [permiso, pedirPermiso] = useCameraPermissions();
      const camaraRef = useRef<CameraView>(null);
      const [camaraAbierta, setCamaraAbierta] = useState(false);
      const [guardando, setGuardando] = useState(false);
    
      const hayLectura = datos.estadoMedidor !== 'inaccesible' && datos.lecturaActual.trim() !== '';
      const consumo =
        hayLectura && medidor
          ? calcularConsumo(Number(datos.lecturaActual), medidor.ultimaLectura, medidor.promedioMensual)
              .consumo
          : null;
    
      // R7: Foto obligatoria si el consumo es anómalo o el medidor está dañado
      const fotoObligatoria = datos.esAnomalo || datos.estadoMedidor === 'danado';
      const puedeGuardar = !guardando && (!fotoObligatoria || !!datos.fotoUri);
    
      const abrirCamara = async () => {
        if (!permiso?.granted) {
          const res = await pedirPermiso();
          if (!res.granted) {
            Alert.alert(
              'Permiso Denegado',
              fotoObligatoria
                ? 'Se requiere acceso a la cámara para la fotografía de respaldo obligatoria. Por favor actívelo en los ajustes del dispositivo.'
                : 'No se concedió acceso a la cámara. Puede conceder el permiso en ajustes o continuar sin fotografía.',
              [
                { text: 'Continuar', style: 'cancel' },
                { text: 'Reintentar', onPress: () => abrirCamara() },
              ],
            );
            return;
          }
        }
        setCamaraAbierta(true);
      };
    
      const tomarFoto = async () => {
        try {
          const foto = await camaraRef.current?.takePictureAsync({ quality: 0.6 });
          if (!foto) return;
          datos.setFotoUri(guardarFotoPermanente(foto.uri, datos.medidorCodigo));
          setCamaraAbierta(false);
        } catch {
          Alert.alert('Error', 'No se pudo guardar la fotografía. Intente nuevamente.');
        }
      };
    
      const ejecutarGuardado = async () => {
        setGuardando(true);
        try {
          await guardarLecturaLocal({
            medidorCodigo: datos.medidorCodigo,
            estadoMedidor: datos.estadoMedidor,
            lectura: hayLectura ? Number(datos.lecturaActual) : null,
            motivo: datos.motivoInaccesibilidad || undefined,
            descripcionDano: datos.descripcionDano || undefined,
            consumoCalculado: consumo,
            fotoUri: datos.fotoUri,
          });
    
          useLecturaStore.getState().resetFormulario();
          queryClient.removeQueries({ queryKey: medidorQueryKey(datos.medidorCodigo) });
          sincronizarSiHayRed().catch(() => undefined);
    
          Alert.alert('Lectura guardada', 'El registro quedó PENDIENTE de envío.', [
            {
              text: 'Aceptar',
              onPress: () => {
                if (router.canDismiss()) router.dismissAll();
                router.replace('/busqueda' as never);
              },
            },
          ]);
        } catch (e) {
          setGuardando(false);
          Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar la lectura.');
        }
      };
    
      const solicitarConfirmacionGuardado = () => {
        if (fotoObligatoria && !datos.fotoUri) {
          Alert.alert(
            'Fotografía Requerida',
            'La fotografía del medidor es obligatoria debido a que se registró una anomalía de consumo o un daño en el medidor.',
            [
              { text: 'Tomar Foto', onPress: abrirCamara },
              { text: 'Cancelar', style: 'cancel' },
            ],
          );
          return;
        }
    
        Alert.alert(
          'Confirmar Guardado',
          '¿Desea registrar esta lectura en el sistema?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Guardar', onPress: ejecutarGuardado },
          ],
        );
      };
    
      if (camaraAbierta) {
        return (
          <View style={styles.camaraContenedor}>
            <CameraView ref={camaraRef} style={StyleSheet.absoluteFill} facing="back" />
            <View style={styles.camaraAcciones}>
              <Pressable
                style={[styles.btnCamara, styles.btnCamaraCancelar]}
                onPress={() => setCamaraAbierta(false)}>
                <Text style={styles.btnCamaraTextoCancelar}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.btnCamara, styles.btnCamaraCapturar]}
                onPress={tomarFoto}>
                <Text style={styles.btnCamaraTextoCapturar}>Capturar</Text>
              </Pressable>
            </View>
          </View>
        );
      }
    
      const badgeEstado = ETIQUETAS_ESTADO[datos.estadoMedidor];
    
      return (
        <SafeAreaView style={styles.screen} edges={[]}>
          <HeaderEpmaps subtitulo="Confirmación" />
          <BotonCancelarRegistro />
          <ScrollView contentContainerStyle={styles.scroll}>
            <BotonVolver onPress={() => router.back()} label="‹ Volver al Paso Anterior" />
    
            <Text style={styles.step}>Paso 3 de 3</Text>
            <Text style={styles.title}>Confirmación del Registro</Text>
    
            {/* Tarjeta de Resumen de Datos */}
            <View style={styles.cardResumen}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.medidorLabel}>Medidor</Text>
                  <Text style={styles.medidorCodigo}>{datos.medidorCodigo}</Text>
                </View>
                <View style={[styles.badgeEstado, { backgroundColor: badgeEstado.bg }]}>
                  <Text style={[styles.badgeEstadoText, { color: badgeEstado.color }]}>
                    {badgeEstado.texto}
                  </Text>
                </View>
              </View>
    
              <View style={styles.divider} />
    
              {datos.estadoMedidor === 'inaccesible' && (
                <View style={styles.filaResumen}>
                  <Text style={styles.filaLabel}>Motivo de inaccesibilidad</Text>
                  <Text style={styles.filaValor}>{datos.motivoInaccesibilidad || 'No especificado'}</Text>
                </View>
              )}
    
              {datos.estadoMedidor === 'danado' && (
                <View style={styles.filaResumen}>
                  <Text style={styles.filaLabel}>Descripción del daño</Text>
                  <Text style={styles.filaValor}>{datos.descripcionDano || 'No especificada'}</Text>
                </View>
              )}
    
              {hayLectura && (
                <View style={styles.filaResumen}>
                  <Text style={styles.filaLabel}>Lectura actual ingresada</Text>
                  <Text style={styles.filaValorLectura}>{datos.lecturaActual}</Text>
                </View>
              )}
    
              {consumo !== null && (
                <View style={styles.filaResumen}>
                  <Text style={styles.filaLabel}>Consumo calculado</Text>
                  <Text style={styles.filaValor}>{consumo} m³</Text>
                </View>
              )}
    
              {datos.esAnomalo && (
                <View style={styles.avisoAnomalia}>
                  <Text style={styles.avisoAnomaliaTexto}>
                    ⚠️ Consumo alto confirmado por el técnico (requiere respaldo fotográfico).
                  </Text>
                </View>
              )}
            </View>
    
            {/* Tarjeta Visor de Fotografía */}
            <View style={styles.cardVisorFoto}>
              <Text style={styles.seccionTitulo}>
                Fotografía de Respaldo {fotoObligatoria ? '(Obligatoria)' : '(Opcional)'}
              </Text>
    
              {datos.fotoUri ? (
                <View style={styles.contenedorFoto}>
                  <Image source={{ uri: datos.fotoUri }} style={styles.foto} />
                </View>
              ) : (
                <View style={styles.placeholderFoto}>
                  <Text style={styles.placeholderIcono}>📷</Text>
                  <Text style={styles.placeholderTexto}>
                    {fotoObligatoria
                      ? 'Fotografía obligatoria antes de guardar.'
                      : 'Sin fotografía capturada.'}
                  </Text>
                </View>
              )}
    
              <Pressable
                style={({ pressed }) => [
                  styles.btnAccionFoto,
                  datos.fotoUri ? styles.btnFotoSecundario : styles.btnFotoPrimario,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={abrirCamara}>
                <Text
                  style={[
                    styles.btnAccionFoto,
                    datos.fotoUri ? styles.btnFotoSecundarioTexto : styles.btnFotoPrimarioTexto,
                  ]}>
                  {datos.fotoUri ? 'Repetir Fotografía' : 'Tomar Fotografía'}
                </Text>
              </Pressable>
            </View>
    
            {/* Botón Principal Destacado */}
            <Pressable
              style={({ pressed }) => [
                styles.btnGuardar,
                !puedeGuardar && styles.btnDisabled,
                pressed && { opacity: 0.9 },
              ]}
              disabled={guardando}
              onPress={solicitarConfirmacionGuardado}>
              {guardando ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.btnGuardarText}>Guardar Lectura</Text>
              )}
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      );
    }
    
    const styles = StyleSheet.create({
      screen: { flex: 1, backgroundColor: PALETTE.bg },
      scroll: { padding: 18, paddingBottom: 40 },
    
      /* Encabezado Institucional */
      headerContainer: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: PALETTE.border,
        paddingBottom: 10,
      },
      logoWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 10,
      },
      logoImage: { width: 140, height: 45 },
      textoEpmaps: {
        fontFamily: 'Roboto_700Bold',
        fontSize: 22,
        color: PALETTE.primary,
        letterSpacing: 1.2,
      },
    
      /* Botón Volver */
      btnVolver: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: PALETTE.btnBackBg,
        borderWidth: 1,
        borderColor: PALETTE.border,
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 14,
        marginBottom: 16,
      },
      btnVolverPressed: {
        backgroundColor: PALETTE.border,
        opacity: 0.85,
      },
      btnVolverIcon: {
        fontSize: 20,
        lineHeight: 22,
        fontFamily: 'Roboto_700Bold',
        color: PALETTE.primary,
        marginRight: 6,
      },
      btnVolverText: {
        fontFamily: 'Roboto_500Medium',
        fontSize: 14,
        color: PALETTE.primary,
      },
    
      /* Títulos */
      step: { fontFamily: 'Roboto_500Medium', fontSize: 14, color: PALETTE.secondary },
      title: { fontFamily: 'Roboto_700Bold', fontSize: 24, color: PALETTE.primary, marginBottom: 16 },
    
      /* Tarjeta de Resumen */
      cardResumen: {
        backgroundColor: PALETTE.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: PALETTE.border,
        padding: 18,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      medidorLabel: { fontFamily: 'Roboto_400Regular', fontSize: 13, color: PALETTE.textMuted },
      medidorCodigo: { fontFamily: 'Roboto_700Bold', fontSize: 20, color: PALETTE.primary, marginTop: 2 },
      badgeEstado: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
      },
      badgeEstadoText: {
        fontFamily: 'Roboto_700Bold',
        fontSize: 13,
        letterSpacing: 0.8,
      },
      divider: {
        height: 1,
        backgroundColor: PALETTE.border,
        marginVertical: 14,
      },
      filaResumen: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
      },
      filaLabel: { fontFamily: 'Roboto_400Regular', fontSize: 14, color: PALETTE.textMuted },
      filaValor: {
        fontFamily: 'Roboto_500Medium',
        fontSize: 15,
        color: PALETTE.textDark,
        textAlign: 'right',
        flexShrink: 1,
        marginLeft: 12,
      },
      filaValorLectura: {
        fontFamily: 'Roboto_700Bold',
        fontSize: 18,
        color: PALETTE.primary,
      },
      avisoAnomalia: {
        backgroundColor: '#FEF3C7',
        borderRadius: 10,
        padding: 10,
        marginTop: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#D97706',
      },
      avisoAnomaliaTexto: {
        fontFamily: 'Roboto_500Medium',
        fontSize: 13,
        color: '#92400E',
        lineHeight: 18,
      },
    
      /* Tarjeta Visor Foto */
      cardVisorFoto: {
        backgroundColor: PALETTE.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: PALETTE.border,
        padding: 18,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      seccionTitulo: {
        fontFamily: 'Roboto_500Medium',
        fontSize: 15,
        color: PALETTE.primary,
        marginBottom: 12,
      },
      contenedorFoto: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: PALETTE.border,
        overflow: 'hidden',
        marginBottom: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      foto: { width: '100%', height: 220, resizeMode: 'cover' },
      placeholderFoto: {
        backgroundColor: PALETTE.bg,
        borderRadius: 14,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: PALETTE.border,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        marginBottom: 14,
      },
      placeholderIcono: { fontSize: 32, marginBottom: 6 },
      placeholderTexto: { fontFamily: 'Roboto_400Regular', fontSize: 14, color: PALETTE.textMuted },
      btnAccionFoto: {
        minHeight: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
      },
      btnFotoPrimario: {
        backgroundColor: PALETTE.secondary,
      },
      btnFotoPrimarioTexto: {
        fontFamily: 'Roboto_500Medium',
        color: '#FFFFFF',
        fontSize: 15,
      },
      btnFotoSecundario: {
        backgroundColor: PALETTE.cardSecondary,
        borderWidth: 1,
        borderColor: PALETTE.border,
      },
      btnFotoSecundarioTexto: {
        fontFamily: 'Roboto_500Medium',
        color: PALETTE.primary,
        fontSize: 15,
      },
    
      /* Botón Guardar Lectura */
      btnGuardar: {
        minHeight: 58,
        borderRadius: 14,
        backgroundColor: PALETTE.primary,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        elevation: 4,
        shadowColor: PALETTE.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      btnDisabled: {
        opacity: 0.5,
      },
      btnGuardarText: {
        fontFamily: 'Roboto_700Bold',
        color: '#FFFFFF',
        fontSize: 18,
      },
    
      /* Cámara Pantalla Completa */
      camaraContenedor: { flex: 1, backgroundColor: '#000000' },
      camaraAcciones: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
      },
      btnCamara: {
        flex: 1,
        minHeight: 54,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
      },
      btnCamaraCancelar: {
        backgroundColor: '#334155',
      },
      btnCamaraCapturar: {
        backgroundColor: PALETTE.primary,
      },
      btnCamaraTextoCancelar: {
        fontFamily: 'Roboto_500Medium',
        color: '#FFFFFF',
        fontSize: 16,
      },
      btnCamaraTextoCapturar: {
        fontFamily: 'Roboto_700Bold',
        color: '#FFFFFF',
        fontSize: 16,
      },
    });