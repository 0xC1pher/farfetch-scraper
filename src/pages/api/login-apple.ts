import type { NextApiRequest, NextApiResponse } from 'next';
import { BrowserMCP } from '../../modules/browser-mcp';

const browserMCP = new BrowserMCP();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, password, proxy } = req.body;
  try {
    const result = await browserMCP.login(email, password, proxy);
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Error en login: ' + (err as Error).message });
  }
}