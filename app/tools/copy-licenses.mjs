import { cp } from 'node:fs/promises';
const destination = process.argv[2];
if (!['local', 'zpe-engine'].includes(destination)) throw new Error('Nieznany wariant paczki.');
await cp('licenses', `dist/${destination}/licenses`, { recursive: true });
