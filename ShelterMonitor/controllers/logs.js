import db from '../utils/database.js';

export async function getLogs(req, res, next) {
    try {
        const [logs] = await db.execute(`
            SELECT logs.id, logs.action, logs.details, logs.timestamp, users.username 
            FROM logs 
            JOIN users ON logs.user_id = users.id 
            ORDER BY logs.timestamp DESC 
            LIMIT 500
        `);
        res.json(logs);
    } catch (err) {
        next(err);
    }
}

export function actionLogger(req, res, next) {
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        const originalJson = res.json;
        res.json = function (body) {
            if (res.statusCode >= 200 && res.statusCode < 300 && req.user_id) {
                let actionName = `${req.method} ${req.originalUrl}`;
                
                let detailsObj = req.body ? { ...req.body } : {};
                if (detailsObj.password) {
                    detailsObj.password = '***';
                }
                
                const details = JSON.stringify(detailsObj);
                const userId = req.user_id;

                db.execute(
                    'INSERT INTO logs (user_id, action, details) VALUES (?, ?, ?)',
                    [userId, actionName, details]
                ).catch(err => console.error('Failed to write log:', err));
            }
            originalJson.call(this, body);
        };
    }
    next();
}

export default {
    getLogs,
    actionLogger
};
