import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.query;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Invalid email parameter' });
  }

  try {
    // Call the backend API instead of direct database access
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${apiUrl}/api/check-email?email=${encodeURIComponent(email)}`);
    
    if (!response.ok) {
      throw new Error('Backend API request failed');
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error checking email:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
