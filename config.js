require('dotenv').config();
const botToken = process.env.BOT_TOKEN;
const dbConn = process.env.DB_CONN;

module.exports = {
    botToken,
    dbConn,
}