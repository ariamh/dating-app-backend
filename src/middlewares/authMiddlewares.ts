import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET_KEY = "dealls-dating-2024";

interface UserPayload {
	id: string;
	email: string;
}

export interface AuthenticatedRequest extends Request {
	user?: UserPayload;
}

export const authenticateToken = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): void => {
	try {
		const authHeader = req.headers["authorization"];
		const token = authHeader?.split(" ")[1];

		if (!token) {
			res.status(401).json({
				error: 'No token provided'
			});
			return;
		}

		if (!authHeader?.startsWith('Bearer ')) {
			res.status(401).json({
				error: 'Invalid token format'
			});
			return;
		}

		jwt.verify(token, JWT_SECRET_KEY, (err, decoded) => {
			if (err) {
				if (err.name === 'TokenExpiredError') {
					res.status(401).json({
						error: 'Token has expired'
					});
					return;
				}

				if (err.name === 'JsonWebTokenError') {
					res.status(403).json({
						error: 'Invalid token'
					});
					return;
				}

				res.status(403).json({
					error: 'Token verification failed'
				});
				return;
			}

			if (!decoded || typeof decoded !== 'object') {
				res.status(403).json({
					error: 'Invalid token payload'
				});
				return;
			}

			req.user = decoded as UserPayload;
			next();
		});

	} catch (error) {
		console.error('Authentication error:', error);
		res.status(500).json({
			error: 'Internal server error'
		});
	}
};

export const createToken = (user: UserPayload): string => {
	return jwt.sign(user, JWT_SECRET_KEY, { expiresIn: '1h' });
};