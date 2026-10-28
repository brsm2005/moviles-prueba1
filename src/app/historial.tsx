import { useForm } from '@tanstack/react-form';
    import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
    import { CameraView, useCameraPermissions } from 'expo-camera';
    import { appAlert } from '@/components/app-alert';
    import { useRouter } from 'expo-router';
    import { useRef, useState } from 'react';
    import {
      Alert,
      FlatList,
      Image,
      KeyboardAvoidingView,
      Modal,
      Platform,
      Pressable,
      StyleSheet,
      Text,
      TextInput,
      View,
    } from 'react-native';
    import { SafeAreaView } from 'react-native-safe-area-context';
    
    import { HeaderEpmaps } from '@/components/header-epmaps';
    import { calcularConsumo } from '@/features/lecturas/calculoConsumo';
    import {
      actualizarLecturaPendiente,
      listarLecturas,
      obtenerReferenciaConsumo,
      type LecturaRegistrada,
    } from '@/features/lecturas/lecturas.service';
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
      pendienteBg: '#FEF3C7',
      pendienteText: '#D97706',
      enviadoBg: '#DCFCE7',
      enviadoText: '#16A34A',
      warningBorder: '#D97706',
      warningBg: '#FEF3C7',
      warningText: '#92400E',
    };
    
    const NUMERO = /^\d+(\.\d+)?$/;
    
    const formatoFecha = (iso: string) =>
      new Date(iso).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
    
    /** Botón estilizado de retorno prominente */
    function BotonVolver({ onPress, label = 'Volver a Consulta' }: { onPress: () => void; label?: string }) {
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
    
    export default function HistorialScreen() {
      const router = useRouter();
      const [editando, setEditando] = useState<LecturaRegistrada | null>(null);
    
      // Refresco periódico para sincronizar el estado de los chips
      const { data: lecturas = [] } = useQuery({
        queryKey: ['lecturas'],
        queryFn: listarLecturas,
        staleTime: 0,
        refetchInterval: 5000,
      });
    
      const handlePressItem = (item: LecturaRegistrada) => {
        const esPendiente = item.sincronizado === 0;
        if (!esPendiente) {
          Alert.alert(
            'Lectura Sincronizada',
            'Esta lectura ya fue transmitida a la oficina central y no puede ser modificada.',
          );
          return;
        }
        setEditando(item);
      };
    
      return (
        <SafeAreaView style={styles.screen} edges={[]}>
          <HeaderEpmaps subtitulo="Historial" />
          <FlatList
            data={lecturas}
            keyExtractor={(l) => String(l.id)}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <View style={styles.headerArea}>
                <BotonVolver onPress={() => router.back()} label="‹ Volver a Consulta" />
                <Text style={styles.title}>Historial de Lecturas</Text>
                <Text style={styles.subtitle}>
                  Listado de lecturas registradas en el dispositivo móvil.
                </Text>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>Aún no hay lecturas registradas en esta jornada.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const pendiente = item.sincronizado === 0;
              return (
                <Pressable
                  onPress={() => handlePressItem(item)}
                  style={({ pressed }) => [
                    styles.card,
                    { borderLeftColor: pendiente ? PALETTE.pendienteText : PALETTE.enviadoText },
                    pressed && { opacity: 0.85 },
                  ]}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.medidorLabel}>Medidor</Text>
                      <Text style={styles.codigo}>{item.medidor_codigo}</Text>
                    </View>
                    <View
                      style={[
                        styles.chip,
                        { backgroundColor: pendiente ? PALETTE.pendienteBg : PALETTE.enviadoBg },
                      ]}>
                      <Text
                        style={[
                          styles.chipText,
                          { color: pendiente ? PALETTE.pendienteText : PALETTE.enviadoText },
                        ]}>
                        {pendiente ? '⏱ PENDIENTE' : '✓ ENVIADO'}
                      </Text>
                    </View>
                  </View>
    
                  <View style={styles.divider} />
    
                  <View style={styles.filaDato}>
                    <Text style={styles.metaLabel}>Estado del medidor:</Text>
                    <Text style={styles.metaValor}>{item.estado_medidor}</Text>
                  </View>
    
                  <View style={styles.filaDato}>
                    <Text style={styles.metaLabel}>Fecha de registro:</Text>
                    <Text style={styles.metaValor}>{formatoFecha(item.fecha_registro)}</Text>
                  </View>
    
                  {item.lectura !== null && (
                    <View style={styles.filaDato}>
                      <Text style={styles.metaLabel}>Lectura tomada:</Text>
                      <Text style={styles.metaValorLectura}>{item.lectura}</Text>
                    </View>
                  )}
    
                  {item.consumo_calculado !== null && (
                    <View style={styles.filaDato}>
                      <Text style={styles.metaLabel}>Consumo calculado:</Text>
                      <Text style={styles.metaValor}>{item.consumo_calculado} m³</Text>
                    </View>
                  )}
    
                  {item.motivo && (
                    <View style={styles.filaDato}>
                      <Text style={styles.metaLabel}>Motivo:</Text>
                      <Text style={styles.metaValor}>{item.motivo}</Text>
                    </View>
                  )}
    
                  {item.descripcion_dano && (
                    <View style={styles.filaDato}>
                      <Text style={styles.metaLabel}>Daño:</Text>
                      <Text style={styles.metaValor}>{item.descripcion_dano}</Text>
                    </View>
                  )}
    
                  <View style={styles.cardFooter}>
                    {pendiente ? (
                      <Text style={styles.editar}>✏️ Toque para editar lectura</Text>
                    ) : (
                      <Text style={styles.bloqueado}>🔒 Transmitido a oficina · Registro protegido</Text>
                    )}
                  </View>
                </Pressable>
              );
            }}
          />
    
          {editando && <EditarLecturaModal lectura={editando} onClose={() => setEditando(null)} />}
        </SafeAreaView>
      );
    }
    
    function EditarLecturaModal({
      lectura,
      onClose,
    }: {
      lectura: LecturaRegistrada;
      onClose: () => void;
    }) {
      const queryClient = useQueryClient();
      const esInaccesible = lectura.estado_medidor === 'Inaccesible';
      const esDanado = lectura.estado_medidor === 'Dañado';
    
      const { data: referencia } = useQuery({
        queryKey: ['referencia-consumo', lectura.medidor_codigo],
        queryFn: () => obtenerReferenciaConsumo(lectura.medidor_codigo),
      });
    
      const [confirmado, setConfirmado] = useState(false);
      const [fotoUri, setFotoUri] = useState<string | null>(lectura.foto_uri);
      const [camaraAbierta, setCamaraAbierta] = useState(false);
      const camaraRef = useRef<CameraView>(null);
      const [permiso, pedirPermiso] = useCameraPermissions();
    
      const solicitarPermiso = async () => {
        const res = await pedirPermiso();
        if (res.granted) {
          setCamaraAbierta(true);
          return;
        }
        appAlert(
          'Permiso de cámara denegado',
          'Se requiere acceso a la cámara para capturar la fotografía de respaldo. Actívelo en los ajustes del dispositivo.',
          'warning',
        );
      };

      const abrirCamara = () => {
        if (permiso?.granted) {
          setCamaraAbierta(true);
          return;
        }
        appAlert(
          'Acceso a la cámara',
          'EPMAPS Campo necesita la cámara para tomar la foto de respaldo del medidor.',
          'info',
          [
            { texto: 'Permitir cámara', onPress: solicitarPermiso },
            { texto: 'Ahora no', secundario: true },
          ],
        );
      };
    
      const tomarFoto = async () => {
        try {
          const foto = await camaraRef.current?.takePictureAsync({ quality: 0.6 });
          if (!foto) return;
          setFotoUri(guardarFotoPermanente(foto.uri, lectura.medidor_codigo));
          setCamaraAbierta(false);
        } catch {
          Alert.alert('Error', 'No se pudo guardar la fotografía.');
        }
      };
    
      const guardar = useMutation({
        mutationFn: (v: { lectura: string; motivo: string; descripcion: string }) =>
          actualizarLecturaPendiente(lectura.id, {
            lectura: esInaccesible || !v.lectura.trim() ? null : Number(v.lectura),
            motivo: esInaccesible ? v.motivo.trim() : null,
            descripcionDano: esDanado ? v.descripcion.trim() : null,
            fotoUri,
          }),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['lecturas'] });
          onClose();
        },
        onError: (e) => {
          Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo actualizar la lectura.');
          queryClient.invalidateQueries({ queryKey: ['lecturas'] });
        },
      });
    
      const form = useForm({
        defaultValues: {
          lectura: lectura.lectura !== null ? String(lectura.lectura) : '',
          motivo: lectura.motivo ?? '',
          descripcion: lectura.descripcion_dano ?? '',
        },
        onSubmit: ({ value }) => guardar.mutateAsync(value),
      });
    
      const handleValidarYGuardar = (valores: { lectura: string; motivo: string; descripcion: string }) => {
        if (esInaccesible) {
          if (!valores.motivo.trim()) {
            Alert.alert('Motivo Requerido', 'El motivo de inaccesibilidad es obligatorio.');
            return;
          }
          form.handleSubmit();
          return;
        }
    
        if (esDanado && !valores.descripcion.trim()) {
          Alert.alert('Descripción Requerida', 'La descripción del daño es obligatoria.');
          return;
        }
    
        const valorLimpio = valores.lectura.trim();
        if (!valorLimpio && !esDanado) {
          Alert.alert('Lectura Requerida', 'La lectura actual es obligatoria.');
          return;
        }
    
        if (valorLimpio && !NUMERO.test(valorLimpio)) {
          Alert.alert('Lectura Inválida', 'La lectura ingresada debe contener exclusivamente números.');
          return;
        }
    
        // Evaluación de Consumo Anómalo
        if (valorLimpio && referencia) {
          const numLectura = Number(valorLimpio);
          if (numLectura < referencia.ultimaLectura) {
            Alert.alert(
              'Lectura Inválida',
              `La lectura ingresada (${numLectura}) no puede ser menor a la lectura anterior (${referencia.ultimaLectura}).`,
            );
            return;
          }
    
          const resConsumo = calcularConsumo(numLectura, referencia.ultimaLectura, referencia.promedioMensual);
          if (resConsumo.esAnomalo && !confirmado) {
            Alert.alert(
              'Consumo Anómalo Detectado',
              `El consumo calculado (${resConsumo.consumo} m³) supera 3 veces el promedio mensual (${referencia.promedioMensual * 3}).
              ¿Confirma que la cifra ingresada es correcta?`,
              [
                { text: 'Revisar Cifra', style: 'cancel' },
                {
                  text: 'Confirmar y Proceder',
                  onPress: () => {
                    setConfirmado(true);
                    if (!fotoUri) {
                      Alert.alert(
                        'Fotografía Requerida',
                        'Al registrarse un consumo anómalo, la foto de respaldo es obligatoria.',
                        [{ text: 'Tomar Foto', onPress: abrirCamara }],
                      );
                      return;
                    }
                    form.handleSubmit();
                  },
                },
              ],
            );
            return;
          }
    
          if (resConsumo.esAnomalo && !fotoUri) {
            Alert.alert(
              'Fotografía Requerida',
              'La fotografía del medidor es obligatoria ante un consumo anómalo.',
              [{ text: 'Tomar Foto', onPress: abrirCamara }],
            );
            return;
          }
        }
    
        if (esDanado && !fotoUri) {
          Alert.alert(
            'Fotografía Requerida',
            'La fotografía del medidor es obligatoria para registros en estado Dañado.',
            [{ text: 'Tomar Foto', onPress: abrirCamara }],
          );
          return;
        }
    
        form.handleSubmit();
      };
    
      if (camaraAbierta) {
        return (
          <Modal animationType="slide" onRequestClose={() => setCamaraAbierta(false)}>
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
          </Modal>
        );
      }
    
      return (
        <Modal animationType="slide" transparent onRequestClose={onClose}>
          <KeyboardAvoidingView
            style={styles.overlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={styles.sheetSubtitle}>Editar Registro Pendiente</Text>
                  <Text style={styles.sheetTitle}>Medidor: {lectura.medidor_codigo}</Text>
                </View>
                <Pressable style={styles.sheetCloseBtn} onPress={onClose}>
                  <Text style={styles.sheetCloseText}>✕</Text>
                </Pressable>
              </View>
    
              <Text style={styles.sheetEstadoMeta}>Estado: {lectura.estado_medidor}</Text>
    
              {!esInaccesible && (
                <form.Field name="lectura">
                  {(field) => (
                    <View style={styles.group}>
                      <Text style={styles.label}>
                        Lectura actual {esDanado ? '(opcional)' : '(obligatoria)'}
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={field.state.value}
                        onChangeText={field.handleChange}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  )}
                </form.Field>
              )}
    
              {esInaccesible && (
                <form.Field name="motivo">
                  {(field) => (
                    <View style={styles.group}>
                      <Text style={styles.label}>Motivo de inaccesibilidad</Text>
                      <TextInput
                        style={styles.input}
                        value={field.state.value}
                        onChangeText={field.handleChange}
                        placeholder="Describa el motivo"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  )}
                </form.Field>
              )}
    
              {esDanado && (
                <form.Field name="descripcion">
                  {(field) => (
                    <View style={styles.group}>
                      <Text style={styles.label}>Descripción del daño</Text>
                      <TextInput
                        style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
                        value={field.state.value}
                        onChangeText={field.handleChange}
                        multiline
                        placeholder="Describa el daño del medidor"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  )}
                </form.Field>
              )}
    
              <form.Subscribe
                selector={(s) => [s.values.lectura, s.values.motivo, s.values.descripcion] as const}>
                {([l, m, d]) => {
                  const anomalo =
                    !esInaccesible &&
                    !!referencia &&
                    NUMERO.test(l.trim()) &&
                    calcularConsumo(Number(l), referencia.ultimaLectura, referencia.promedioMensual)
                      .esAnomalo;
                  const fotoObligatoria = anomalo || esDanado;
    
                  return (
                    <>
                      {anomalo && (
                        <View style={styles.alertaAnomalia}>
                          <Text style={styles.alertaTitulo}>⚠️ Consumo alto detectado</Text>
                          <Text style={styles.alertaTexto}>
                            Supera 3 veces el promedio mensual ({referencia?.promedioMensual * 3}).
                            La foto de respaldo es obligatoria.
                          </Text>
                          <Pressable
                            style={styles.checkRow}
                            onPress={() => setConfirmado(!confirmado)}>
                            <View style={[styles.checkbox, confirmado && styles.checkboxChecked]}>
                              {confirmado && <Text style={styles.checkMark}>✓</Text>}
                            </View>
                            <Text style={styles.checkText}>Confirmar que la lectura es correcta</Text>
                          </Pressable>
                        </View>
                      )}
    
                      {(fotoObligatoria || fotoUri) && (
                        <View style={styles.group}>
                          <Text style={styles.label}>
                            Foto de respaldo {fotoObligatoria ? '(obligatoria)' : '(opcional)'}
                          </Text>
                          {fotoUri && (
                            <View style={styles.contenedorFotoModal}>
                              <Image source={{ uri: fotoUri }} style={styles.fotoModal} />
                            </View>
                          )}
                          <Pressable
                            style={[
                              styles.btnFotoModal,
                              fotoUri ? styles.btnFotoModalSec : styles.btnFotoModalPrim,
                            ]}
                            onPress={abrirCamara}>
                            <Text
                              style={[
                                styles.btnFotoModalTexto,
                                fotoUri ? { color: PALETTE.primary } : { color: '#FFFFFF' },
                              ]}>
                              {fotoUri ? 'Repetir Fotografía' : 'Tomar Fotografía'}
                            </Text>
                          </Pressable>
                        </View>
                      )}
    
                      <View style={styles.accionesModal}>
                        <Pressable style={styles.btnModalCancelar} onPress={onClose}>
                          <Text style={styles.btnModalCancelarTexto}>Cancelar</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.btnModalGuardar, guardar.isPending && { opacity: 0.6 }]}
                          disabled={guardar.isPending}
                          onPress={() => handleValidarYGuardar({ lectura: l, motivo: m, descripcion: d })}>
                          <Text style={styles.btnModalGuardarTexto}>
                            {guardar.isPending ? 'Guardando...' : 'Guardar Cambios'}
                          </Text>
                        </Pressable>
                      </View>
                    </>
                  );
                }}
              </form.Subscribe>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      );
    }
    
    const styles = StyleSheet.create({
      screen: { flex: 1, backgroundColor: PALETTE.bg },
      list: { padding: 18, paddingBottom: 36, gap: 14 },
      headerArea: { marginBottom: 6 },
      title: { fontFamily: 'Roboto_700Bold', fontSize: 24, color: PALETTE.primary, marginTop: 4 },
      subtitle: { fontFamily: 'Roboto_400Regular', fontSize: 14, color: PALETTE.textMuted, marginTop: 2 },
      emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 48 },
      emptyIcon: { fontSize: 42, marginBottom: 8 },
      emptyText: { fontFamily: 'Roboto_400Regular', color: PALETTE.textMuted, textAlign: 'center', fontSize: 15 },
    
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
        marginBottom: 12,
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
    
      /* Tarjetas de Lecturas */
      card: {
        backgroundColor: PALETTE.card,
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        borderWidth: 1,
        borderColor: PALETTE.border,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
      medidorLabel: { fontFamily: 'Roboto_400Regular', fontSize: 12, color: PALETTE.textMuted },
      codigo: { fontFamily: 'Roboto_700Bold', fontSize: 18, color: PALETTE.primary },
      chip: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
      },
      chipText: { fontFamily: 'Roboto_700Bold', fontSize: 12 },
      divider: { height: 1, backgroundColor: PALETTE.border, marginVertical: 10 },
      filaDato: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
      metaLabel: { fontFamily: 'Roboto_400Regular', fontSize: 13, color: PALETTE.textMuted },
      metaValor: { fontFamily: 'Roboto_500Medium', fontSize: 14, color: PALETTE.textDark },
      metaValorLectura: { fontFamily: 'Roboto_700Bold', fontSize: 15, color: PALETTE.primary },
      cardFooter: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
      editar: { fontFamily: 'Roboto_500Medium', fontSize: 13, color: PALETTE.secondary },
      bloqueado: { fontFamily: 'Roboto_500Medium', fontSize: 13, color: '#047857' },
    
      /* Modal de Edición */
      overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
      sheet: {
        backgroundColor: PALETTE.card,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '90%',
      },
      sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
      sheetSubtitle: { fontFamily: 'Roboto_400Regular', fontSize: 13, color: PALETTE.textMuted },
      sheetTitle: { fontFamily: 'Roboto_700Bold', fontSize: 20, color: PALETTE.primary, marginTop: 2 },
      sheetCloseBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: PALETTE.cardSecondary,
        alignItems: 'center',
        justifyContent: 'center',
      },
      sheetCloseText: { fontSize: 15, color: PALETTE.textMuted, fontFamily: 'Roboto_700Bold' },
      sheetEstadoMeta: { fontFamily: 'Roboto_500Medium', fontSize: 14, color: PALETTE.secondary, marginVertical: 8 },
      group: { marginTop: 12 },
      label: { fontFamily: 'Roboto_500Medium', fontSize: 14, color: PALETTE.primary, marginBottom: 6 },
      input: {
        fontFamily: 'Roboto_500Medium',
        minHeight: 52,
        borderWidth: 1.5,
        borderColor: PALETTE.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        fontSize: 18,
        color: PALETTE.textDark,
        backgroundColor: PALETTE.bg,
      },
      alertaAnomalia: {
        backgroundColor: PALETTE.warningBg,
        borderWidth: 1.5,
        borderColor: PALETTE.warningBorder,
        borderRadius: 12,
        padding: 12,
        marginTop: 14,
      },
      alertaTitulo: { fontFamily: 'Roboto_700Bold', fontSize: 15, color: PALETTE.warningText },
      alertaTexto: { fontFamily: 'Roboto_400Regular', fontSize: 13, color: PALETTE.warningText, marginTop: 2 },
      checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, minHeight: 40 },
      checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: PALETTE.warningBorder,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
      },
      checkboxChecked: { backgroundColor: PALETTE.primary, borderColor: PALETTE.primary },
      checkMark: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Roboto_700Bold' },
      checkText: { flex: 1, fontFamily: 'Roboto_500Medium', fontSize: 13, color: PALETTE.warningText },
    
      /* Foto en Modal */
      contenedorFotoModal: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: PALETTE.border,
        overflow: 'hidden',
        marginBottom: 8,
      },
      fotoModal: { width: '100%', height: 160, resizeMode: 'cover' },
      btnFotoModal: {
        minHeight: 46,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
      },
      btnFotoModalPrim: { backgroundColor: PALETTE.secondary },
      btnFotoModalSec: { backgroundColor: PALETTE.cardSecondary, borderWidth: 1, borderColor: PALETTE.border },
      btnFotoModalTexto: { fontFamily: 'Roboto_500Medium', fontSize: 14 },
    
      /* Acciones del Modal */
      accionesModal: { flexDirection: 'row', gap: 12, marginTop: 20 },
      btnModalCancelar: {
        flex: 1,
        minHeight: 52,
        borderRadius: 12,
        backgroundColor: PALETTE.cardSecondary,
        borderWidth: 1,
        borderColor: PALETTE.border,
        alignItems: 'center',
        justifyContent: 'center',
      },
      btnModalCancelarTexto: { fontFamily: 'Roboto_500Medium', color: PALETTE.textDark, fontSize: 16 },
      btnModalGuardar: {
        flex: 1,
        minHeight: 52,
        borderRadius: 12,
        backgroundColor: PALETTE.primary,
        alignItems: 'center',
        justifyContent: 'center',
      },
      btnModalGuardarTexto: { fontFamily: 'Roboto_700Bold', color: '#FFFFFF', fontSize: 16 },
    
      /* Cámara en Modal */
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
      btnCamaraCancelar: { backgroundColor: '#334155' },
      btnCamaraCapturar: { backgroundColor: PALETTE.primary },
      btnCamaraTextoCancelar: { fontFamily: 'Roboto_500Medium', color: '#FFFFFF', fontSize: 16 },
      btnCamaraTextoCapturar: { fontFamily: 'Roboto_700Bold', color: '#FFFFFF', fontSize: 16 },
    });