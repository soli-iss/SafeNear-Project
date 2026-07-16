import db from '../utils/database.js';
import Shelter from '../models/shelter.js';
import { getAdminAuth } from './auth.js';
import { NotFoundError } from '../utils/errors.js';

export async function getShelters(req, res, next) {
    try {
        const [shelters] = await Shelter.fetchAll();
        res.json(shelters);
    } catch (err) {
        next(err);
    }
};

export async function getShelterById(req, res, next) {
    try {
        const shelterId = req.params.id;
        const [results, fields] = await db.execute('SELECT * FROM shelters WHERE id = ? LIMIT 1', [shelterId]);
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            throw new NotFoundError('Shelter not found');
        }
    } catch (err) {
        next(err);
    }
};

export async function insertShelter(req, res, next) {
    try {
        const { name, open, location, mapID, map_id, x = null, y = null } = req.body;
        const actualMapId = map_id !== undefined ? map_id : mapID;
        const newShelter = new Shelter(name, open, location, actualMapId, x, y);
        await newShelter.save();
        res.json({ message: 'Shelter inserted successfully' });
    } catch (err) {
        next(err);
    }
};

export async function updateShelter(req, res, next) {
    try {
        const shelterId = req.params.id;
        const { name, open, location, mapID, map_id, x = null, y = null } = req.body;
        const actualMapId = map_id !== undefined ? map_id : mapID;
        const [results] = await db.execute(
            'UPDATE shelters SET name = ?, open = ?, location = ?, map_id = ?, x = ?, y = ? WHERE id = ?',
            [name, open, location, actualMapId, x, y, shelterId]
        );
        if (results.affectedRows > 0) {
            res.json({ message: 'Shelter updated successfully' });
        } else {
            throw new NotFoundError('Shelter not found');
        }
    } catch (err) {
        next(err);
    }
};

export async function deleteShelter(req, res, next) {
    try {
        const shelterId = req.params.id;
        const [results] = await db.execute('DELETE FROM shelters WHERE id = ?', [shelterId]);
        if (results.affectedRows > 0) {
            res.json({ message: 'Shelter deleted successfully' });
        } else {
            throw new NotFoundError('Shelter not found');
        }
    } catch (err) {
        next(err);
    }
};

export default {
    getShelters,
    getShelterById,
    insertShelter,
    updateShelter,
    deleteShelter
};

