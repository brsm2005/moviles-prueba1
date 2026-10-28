import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'epmaps_session';

export interface Session {
  codigoEmpleado: string;
  loggedAt: string;
}

export const EMPLOYEE_CODE_REGEX = /^[A-Za-z0-9-]{3,20}$/;

// RF1: técnicos autorizados (usuarios fijos, sin servidor de autenticación).
const USUARIOS: Record<string, string> = {
  bryan: 'Bryan123',
  salvador: 'Salvador123',
  juan: 'Juan123',
};
const NOMBRES: Record<string, string> = { bryan: 'Bryan', salvador: 'Salvador', juan: 'Juan' };

export async function login(codigoEmpleado: string, clave: string): Promise<Session> {
  const llave = codigoEmpleado.trim().toLowerCase();
  if (!(llave in USUARIOS) || USUARIOS[llave] !== clave) {
    throw new Error('Credenciales inválidas');
  }
  const session: Session = { codigoEmpleado: NOMBRES[llave], loggedAt: new Date().toISOString() };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function getSession(): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as Session) : null;
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}
