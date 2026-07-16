import db from '../utils/database.js';

export class User {
    constructor(username, password, admin) {
        this.username = username;
        this.password = password;
        this.admin = admin;
    }

    save() {
        return db.execute('INSERT INTO users (username, password, admin, created_at) VALUES (?, ?, ?, NOW())', [ this.username, this.password, this.admin]);
    };


    static fetchAll() {
        return db.execute('SELECT * FROM users');
    };

    static async findById(id) {
        const [results] = await db.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
        return results[0] || null;
    }

    static async findByUsernameAndPassword(username, password) {
        const [results] = await db.execute('SELECT * FROM users WHERE username = ? AND password = ? LIMIT 1', [username, password]);
        return results[0] || null;
    }

};

export default User;