const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');


const bot = new TelegramBot(config.botToken, { polling: true });

let sender, suggestion, category;
bot.onText(/\/suggest (.+)/, (msg, match) => {
    sender = msg.from.first_name + ' ' + msg.from.last_name;
    suggestion = match[1];
    console.log(sender, suggestion);
    bot.sendMessage(msg.chat.id, 'Choose Category', {
        reply_markup: {
            inline_keyboard: [[
                {
                    text: 'Movie',
                    callback_data: 'movie'
                },
                {
                    text: 'Series',
                    callback_data: 'series'
                },
                {
                    text: 'Others',
                    callback_data: 'others'
                }
            ]]
        }
    });
}); 

bot.on('callback_query', (cbQuery) => {
    console.log(cbQuery.message);
    bot.deleteMessage(cbQuery.message.chat.id, cbQuery.message.message_id);
    category = cbQuery.data;
    console.log(sender, suggestion, category);
    bot.sendMessage(cbQuery.message.chat.id, 'Thank you for your response');
});