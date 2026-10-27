import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'epmaps_session';

export interface Session {
  codigoEmpleado: string;
  loggedAt: string;
}

export const EMPLOYEE_CODE_REGEX = /^[A-Za-z0-9-]{3,20}$/;

export async function login(codigoEmpleado: string, clave: string): Promise<Session> {
  if (!EMPLOYEE_CODE_REGEX.test(codigoEmpleado) || clave.length < 4) {
    throw new Error('Credenciales inválidas');
  }
  const session: Session = { codigoEmpleado, loggedAt: new Date().toISOString() };
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
