type SessionPayload<TSession> = {
  data: {
    session: TSession | null;
  };
};

export async function resolveInitialSession<TSession>(
  getSession: () => Promise<SessionPayload<TSession>>,
  onError?: (error: unknown) => void,
): Promise<TSession | null> {
  try {
    const { data } = await getSession();
    return data.session;
  } catch (error) {
    onError?.(error);
    return null;
  }
}
