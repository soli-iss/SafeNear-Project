import db from '../utils/database.js';
import Map from '../models/map.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { getAdminAuth } from './auth.js';

export async function getMaps(req, res, next) {
    try {
        const [maps] = await Map.fetchAll();
        res.json(maps);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

export async function getMapById(req, res, next) {
    try {
        const mapId = req.params.id;
        const [results, fields] = await db.execute('SELECT * FROM maps WHERE id = ? LIMIT 1', [mapId]);
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).json({ message: 'Map not found' });
        }
    } catch (err) {
        console.log(err);
        next(err);
    }
};

export async function insertMap(req, res, next) {
    try {
        const name = req.body.name;
        const path = req.file ? req.file.filename : req.body.path;

        if (!path) {
             return res.status(400).json({ message: 'Map image is required' });
        }

        const map = new Map(name, path);
        await map.save();
        res.json({ message: 'Map inserted successfully', path: path });
    } catch (err) {
        console.log(err);
        next(err);
    }
};

export async function updateMap(req, res, next) {
    try {
        const mapId = req.params.id;
        const name = req.body.name;
        const newPath = req.file ? req.file.filename : req.body.path;

        const [oldMaps] = await db.execute('SELECT path FROM maps WHERE id = ?', [mapId]);

        const [results, fields] = await db.execute('UPDATE maps SET name = ?, path = ? WHERE id = ?', [name, newPath, mapId]);
        if (results.affectedRows > 0) {
            if (req.file && oldMaps.length > 0 && oldMaps[0].path && oldMaps[0].path !== newPath) {
                const oldFilePath = path.join(__dirname, '../public', oldMaps[0].path);
                fs.unlink(oldFilePath, (err) => {
                    if (err) console.error('Failed to delete old map file:', err);
                });
            }
            res.json({ message: 'Map updated successfully', path: newPath });
        } else {
            res.status(404).json({ message: 'Map not found' });
        }
    } catch (err) {
        console.log(err);
        next(err);
    }
};

export async function deleteMap(req, res, next) {
    try {
        const mapId = req.params.id;

        const [maps] = await db.execute('SELECT path FROM maps WHERE id = ?', [mapId]);

        const [results, fields] = await db.execute('DELETE FROM maps WHERE id = ?', [mapId]);
        if (results.affectedRows > 0) {
            if (maps.length > 0 && maps[0].path) {
                const filePath = path.join(__dirname, '../public', maps[0].path);
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Failed to delete map file:', err);
                });
            }
            res.json({ message: 'Map deleted successfully' });
        } else {
            res.status(404).json({ message: 'Map not found' });
        }
    } catch (err) {
        console.log(err);
        next(err);
    }
};

export default {
    getMaps,
    getMapById,
    insertMap,
    updateMap,
    deleteMap
};