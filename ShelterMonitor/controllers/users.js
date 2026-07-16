import db from '../utils/database.js';
import User from '../models/users.js';
import { UnauthorizedError, NotFoundError } from '../utils/errors.js';

export async function getUsers(req, res, next) {
    try {
        const [users] = await User.fetchAll();
        res.json(users);
    } catch (err) {
        next(err);
    }
};

export async function getUserByUsernameAndPassword(req, res, next) {
    try {
        const username = req.body.username;
        const password = req.body.password;

        const [results, fields] = await db.execute('SELECT * FROM users WHERE username = ? AND password = ? LIMIT 1', [username, password]);
        if (results.length > 0) {
            res.status(200).json(results[0]);
        } else { 
            throw new NotFoundError('User not found');  
        }
    } catch (err) {
        next(err);
    }
};

export async function getUserById(req, res, next) {
    try {
        const userId = req.params.id;
        const [results, fields] = await db.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
        if (results.length > 0) {
            res.status(200).json(results[0]);
        } else {
            throw new NotFoundError('User not found');
        }
    } catch (err) {
        next(err);
    }
};

export async function getUserAdmin(req, res, next) {
    try {
        const userId = req.params.id;
        const [results, fields] = await db.execute('SELECT admin FROM users WHERE id = ? LIMIT 1', [userId]);
        if (results.length > 0) {
            res.status(200).json({ admin: results[0].admin });
        } else {
            throw new NotFoundError('User not found');
        }
    } catch (err) {
        next(err);
    }
}

export async function insertUser(req, res, next) {
    try {
        const username = req.body.username;
        const password = req.body.password;
        const admin = req.body.admin;

        const user = new User(username, password, admin);
        await user.save();
        res.status(201).json({ message: 'User inserted successfully' });
    } catch (err) {
        next(err);
    }
}

export async function updateUser(req, res, next) {
    try {
        const userId = req.params.id;
        const username = req.body.username;
        const password = req.body.password;
        const admin = req.body.admin;

        const [results, fields] = await db.execute('UPDATE users SET username = ?, password = ?, admin = ? WHERE id = ?', [username, password, admin, userId]);
        if (results.affectedRows > 0) {
            res.status(200).json({ message: 'User updated successfully' });
        } else {
            throw new NotFoundError('User not found');
        }
    } catch (err) {
        next(err);
    }
};

export async function deleteUser(req, res, next) {
    try {
        const userId = req.params.id;
        const [results, fields] = await db.execute('DELETE FROM users WHERE id = ?', [userId]);
        if (results.affectedRows > 0) {
            res.status(200).json({ message: 'User deleted successfully' });
        } else {
            throw new NotFoundError('User not found');
        }
    } catch (err) {
        next(err);
    }
};

export async function getUserByUsername(req, res, next) {
    try {
        const username = req.params.username;
        const [results, fields] = await db.execute('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
        if (results.length > 0) {
            res.status(200).json(results[0]);
        } else {
            throw new NotFoundError('User not found');
        }
    } catch (err) {
        next(err);
    }
};

export default {
    getUsers,
    getUserById,
    insertUser,
    updateUser,
    deleteUser
};