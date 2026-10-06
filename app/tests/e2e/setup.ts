import { createServer } from 'vite';

export default async function setup() {
  // Serwer w procesie testów: jawne zamknięcie bez drzewa npm/cmd na Windows.
  const server = await createServer({
    server: { host: '127.0.0.1', port: 5174, strictPort: true },
  });
  await server.listen();
  return async () => { await server.close(); };
}
