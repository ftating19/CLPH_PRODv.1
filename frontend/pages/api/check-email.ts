import { NextApiRequest, NextApiResponse } from 'next';
import { getPool } from '../../../backend/dbconnection/mysql';
import { findUserByEmail } from '../../../backend/queries/users';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.query;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Invalid email parameter' });
  }

  try {
    const pool = await getPool();
    const user = await findUserByEmail(pool, email);

    return res.status(200).json({ exists: !!user });
  } catch (error) {
    console.error('Error checking email:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
