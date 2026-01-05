import { Request, Response, NextFunction } from 'express';

interface CustomRequest extends Request {
  user?: {
    id: string;
  };
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Real auth logic would go here
  next();
};

export const mockAuthMiddleware = (req: CustomRequest, res: Response, next: NextFunction): void => {
  // Mock auth for testing
  req.user = { id: 'test-user-id' };
  next();
};
