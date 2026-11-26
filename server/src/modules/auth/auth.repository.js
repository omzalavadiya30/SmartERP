const { database } = require('../../erp/db');
async function one(sql, values) {
    const result = await (await database()).query(sql, values);
    return result.rows[0] || null;
}
const createUser = ({name,email,password}) => one('INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING *',[name,email,password]);
const findUserByEmail = email => one('SELECT * FROM users WHERE email=$1',[email]);
const findUserById = (id,session,version) => one('SELECT id,name,email FROM users WHERE id=$1 AND token_version=$3 AND NOT EXISTS (SELECT 1 FROM revoked_sessions WHERE session_id=$2)',[id,session,version]);
const findUserByResetToken = token => one('SELECT * FROM users WHERE password_reset_token=$1',[token]);
const resetCredential = (token,password) => one('UPDATE users SET password=$2,token_version=token_version+1,password_reset_token=NULL,password_reset_expires_at=NULL,updated_at=now() WHERE password_reset_token=$1 AND password_reset_expires_at>now() RETURNING id',[token,password]);
const revokeSession = (id,expiry) => one('INSERT INTO revoked_sessions(session_id,expires_at) VALUES($1,to_timestamp($2)) ON CONFLICT DO NOTHING RETURNING session_id',[id,expiry]);
const updateUser = (id, data) => one('UPDATE users SET password=coalesce($2,password),password_reset_token=$3,password_reset_expires_at=$4,updated_at=now() WHERE id=$1 RETURNING id',[id,data.password ?? null,data.password_reset_token,data.password_reset_expires_at]);
module.exports = { createUser, findUserByEmail, findUserById, findUserByResetToken, updateUser, resetCredential,revokeSession };
