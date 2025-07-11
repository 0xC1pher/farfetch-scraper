import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MinioStorage, SessionData } from '../index';
import { Client } from 'minio';
import { Readable } from 'stream';

// Mock the minio client
vi.mock('minio', () => {
  const mockMinioClient = {
    bucketExists: vi.fn(),
    makeBucket: vi.fn(),
    putObject: vi.fn(),
    getObject: vi.fn(),
    removeObject: vi.fn(),
    listObjects: vi.fn(),
  };
  return { Client: vi.fn(() => mockMinioClient) };
});

const mockMinio = new Client({
  endPoint: 'localhost',
  accessKey: 'test',
  secretKey: 'test',
}) as any;

describe('MinioStorage', () => {
  let storage: MinioStorage;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Mock successful bucket existence check
    mockMinio.bucketExists.mockResolvedValue(true);
    
    storage = new MinioStorage({ bucket: 'test-bucket' });
  });

  describe('Initialization', () => {
    it('should check if the bucket exists on initialization', async () => {
      // Re-instantiate to test constructor logic
      const newStorage = new MinioStorage({ bucket: 'test-bucket' });
      // Allow async checkAvailability to run
      await new Promise(resolve => setImmediate(resolve));
      expect(mockMinio.bucketExists).toHaveBeenCalledWith('test-bucket');
    });

    it('should create the bucket if it does not exist', async () => {
      mockMinio.bucketExists.mockResolvedValueOnce(false);
      const newStorage = new MinioStorage({ bucket: 'new-bucket' });
      await new Promise(resolve => setImmediate(resolve));
      expect(mockMinio.bucketExists).toHaveBeenCalledWith('new-bucket');
      expect(mockMinio.makeBucket).toHaveBeenCalledWith('new-bucket');
    });
  });

  describe('Session Management', () => {
    const sessionData: SessionData = {
      sessionId: 'session-123',
      cookies: [{ name: 'cookie1', value: 'value1' }],
      timestamp: new Date(),
      status: 'active',
    };

    it('should save a session correctly', async () => {
      await storage.saveSession(sessionData);
      
      expect(mockMinio.putObject).toHaveBeenCalledWith(
        'test-bucket',
        'sessions/session-123.json',
        expect.any(Buffer),
        expect.any(Number),
        { 'Content-Type': 'application/json' }
      );
    });

    it('should load a session correctly', async () => {
      const sessionJson = JSON.stringify(sessionData);
      const stream = Readable.from(Buffer.from(sessionJson));
      mockMinio.getObject.mockResolvedValue(stream);

      const loadedSession = await storage.loadSession('session-123');
      
      expect(mockMinio.getObject).toHaveBeenCalledWith('test-bucket', 'sessions/session-123.json');
      expect(loadedSession).toEqual(sessionData);
    });

    it('should return null when loading a non-existent session', async () => {
      mockMinio.getObject.mockRejectedValue(new Error('Not Found'));
      const loadedSession = await storage.loadSession('non-existent-session');
      expect(loadedSession).toBeNull();
    });

    it('should delete a session correctly', async () => {
      await storage.deleteSession('session-123');
      expect(mockMinio.removeObject).toHaveBeenCalledWith('test-bucket', 'sessions/session-123.json');
    });
  });
});
