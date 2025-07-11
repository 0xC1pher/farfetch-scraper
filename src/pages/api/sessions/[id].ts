import type { NextApiRequest, NextApiResponse } from 'next';
import { minioStorage } from '../../../modules/minio';

interface SessionResponse {
  success: boolean;
  session?: any;
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SessionResponse>
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Session ID is required'
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getSession(id, res);
      
      case 'DELETE':
        return await deleteSession(id, res);
      
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Session API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

async function getSession(sessionId: string, res: NextApiResponse<SessionResponse>) {
  try {
    const session = await minioStorage.loadSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // No devolver información sensible como cookies completas
    const safeSession = {
      sessionId: session.sessionId,
      userId: session.userId,
      status: session.status,
      timestamp: session.timestamp,
      fingerprint: session.fingerprint
    };

    return res.status(200).json({
      success: true,
      session: safeSession,
      message: 'Session retrieved successfully'
    });

  } catch (error) {
    console.error('Error loading session:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load session'
    });
  }
}

async function deleteSession(sessionId: string, res: NextApiResponse<SessionResponse>) {
  try {
    await minioStorage.deleteSession(sessionId);
    
    return res.status(200).json({
      success: true,
      message: 'Session deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting session:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete session'
    });
  }
}
