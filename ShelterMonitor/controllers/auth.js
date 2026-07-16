import db from '../utils/database.js';
import { UnauthorizedError, BadRequestError } from '../utils/errors.js';
import User from '../models/users.js';
import jwt from 'jsonwebtoken';


export async function login(req, res, next) {
    const { username, password } = req.body;
    try {
        const user = await User.findByUsernameAndPassword(username, password);
        if (user) {
            // User found, proceed with login
            const token = makeJWT(user.id, 3600, process.env.JWT_SECRET); // Token expires in 1 hour
            res.json({ message: 'Login successful', user: user, token: token });
        } else {
            // User not found or incorrect credentials
            throw new UnauthorizedError('Incorrect username or password');
        }
    } catch (err) {
        next(err);
    }
};


// Function to generate JWT token
export function makeJWT(userID, expiresIn = 3600, secret) {
    const payload = {
        sub: userID,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + expiresIn, // Default expiration time of 1 hour
    };

    return jwt.sign(payload, secret);
}

export function verifyJWT(token, secret) {
    try {
        const decoded = jwt.verify(token, secret);
        if (!decoded) {
            throw new UnauthorizedError('Invalid token');
        }
        return decoded.sub; // Return the user ID from the token payload
    } catch (err) {
        console.log(err);
        throw new UnauthorizedError('Invalid token');
    }
};

export function getBearerToken(req) {
    const authHeader = req.get("Authorization");
    if (!authHeader) {
        throw new BadRequestError("Authorization header is missing");
    }
    return extractBearerToken(authHeader);
};

export function extractBearerToken(header) {
    const splitAuth = header.split(" ");
    if (splitAuth.length < 2 || splitAuth[0] !== "Bearer") {
        throw new BadRequestError("Invalid Authorization header format");
    }
    return splitAuth[1];
};

export async function getAdminAuth(req) {
    const authHeader = req.get("Authorization");
    if (!authHeader) {
        throw new UnauthorizedError("Authorization header is missing");
    }
    const token = getBearerToken(req);
    const reqUserId = verifyJWT(token, process.env.JWT_SECRET);
    if (!reqUserId) {
        throw new UnauthorizedError("Invalid token");
    }
    const user = await User.findById(reqUserId);
    if (!user || (user.admin !== 1 && user.admin !== true)) {
        throw new UnauthorizedError("User is not an admin");
    }
    return reqUserId;
}

export async function requireAdmin(req, res, next) {
    try {
        req.user_id = await getAdminAuth(req);
        next();
    } catch (err) {
        next(err);
    }
}