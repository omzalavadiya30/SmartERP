const { JWT_SECRET }=require('./constant');
module.exports=function validateEnvironment(){
    if(!JWT_SECRET || JWT_SECRET.length<32) throw new Error('Set JWT_SECRET to at least 32 random characters.');
    if(!process.env.DATABASE_URL && (process.env.NODE_ENV==='production'||!process.env.PGLITE_PATH)) throw new Error('A PostgreSQL connection is required. See the project README.');
};
