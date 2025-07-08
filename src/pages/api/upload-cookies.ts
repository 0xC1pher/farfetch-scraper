import type { NextApiRequest, NextApiResponse } from 'next';
import { MinioStorage } from '../../modules/minio';

const minioStorage = new MinioStorage();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { cookies, userId } = req.body;
  try {
    await minioStorage.saveObject(`sessions/${userId}.json`, JSON.stringify(cookies));
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Error guardando cookies: ' + (err as Error).message });
  }
}
