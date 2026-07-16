import db from '../utils/database.js';

export class Map {
    constructor( name, path) {
        this.name = name;
        this.path = path;
    }

    save() {
        return db.execute('INSERT INTO maps (name, path) VALUES (?, ?)', [this.name, this.path]);
    };

    static fetchAll() {
        return db.execute('SELECT * FROM maps');
    };

};

export default Map;