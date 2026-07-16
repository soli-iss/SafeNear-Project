import db from '../utils/database.js';

export class Shelter {
    constructor(name, open, location, map_id, x = null, y = null) {
        this.name = name;
        this.open = open;
        this.location = location;
        this.map_id = map_id;
        this.x = x;
        this.y = y;
    }

    save() {
        return db.execute(
            'INSERT INTO shelters (name, open, location, map_id, x, y) VALUES (?, ?, ?, ?, ?, ?)',
            [this.name, this.open, this.location, this.map_id, this.x, this.y]
        );
    };

    static fetchAll() {
        return db.execute('SELECT * FROM shelters');
    };

};

export default Shelter;