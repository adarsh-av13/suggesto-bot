const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const mongoose = require('mongoose');
const Suggestion = require('./suggestion');

mongoose.connect(config.dbConn, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to database');
    })
    .catch((err) => {
        console.log('Could not connect to database');
    });

const bot = new TelegramBot(config.botToken, { polling: true });

let sender, suggestion, category;
bot.onText(/\/suggest (.+)/, (msg, match) => {
    sender = msg.from.first_name + ' ' + msg.from.last_name;
    suggestion = match[1];
    console.log(sender, suggestion);
    bot.sendMessage(msg.chat.id, 'Add to Category', {
        reply_markup: {
            one_time_keyboard: true,
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

bot.onText(/\/viewlatest/, (msg, match) => {
    sender = msg.from.first_name + ' ' + msg.from.last_name;
    console.log(sender);
    Suggestion.find({}).sort({ 'createdAt': -1 }).limit(5)
        .then((suggestions) => {
            let reply = '<b><u>Recent Recommendations</u></b>\n\n';
            suggestions.forEach((suggestion, index) => {
                reply += (index + 1) + ') <b>' + suggestion.suggestion + '</b> - ' + suggestion.category + ' - ' + suggestion.suggestedBy + '\n';
            });
            console.log(reply);
            bot.sendMessage(msg.chat.id, reply, { parse_mode: 'html' });
        })
        .catch((err) => console.log);
});

bot.onText(/\/viewbyuser/, (msg, match) => {
    Suggestion.find({}).distinct('suggestedBy')
        .then((suggestors) => {
            let users = [];
            suggestors.forEach((suggestor) => {
                users.push({ text: suggestor, callback_data: suggestor });
            });
            bot.sendMessage(msg.chat.id, 'Choose User', {
                reply_markup: {
                    one_time_keyboard: true,
                    inline_keyboard: [users]
                }
            });
        })
        .catch((err) => console.log);
});

bot.onText(/\/viewbycategory/, (msg, match) => {
    bot.sendMessage(msg.chat.id, 'Choose Category', {
        reply_markup: {
            one_time_keyboard: true,
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
    console.log(cbQuery);
    switch (cbQuery.message.text) {
        case 'Add to Category':
            category = cbQuery.data;
            const newSuggestion = new Suggestion({
                suggestedBy: sender,
                suggestion: suggestion,
                category: category
            });
            newSuggestion.save()
                .then(() => {
                    bot.sendMessage(cbQuery.message.chat.id, sender + ' suggested <b>' + suggestion + '</b> ' + category, { parse_mode: 'HTML' });
                });
            break;
        case 'Choose User':
            Suggestion.find({ suggestedBy: cbQuery.data })
                .then((suggestions) => {
                    let reply = '<b><u>Recommendations by ' + cbQuery.data + '</u></b>\n\n';
                    suggestions.forEach((suggestion, index) => {
                        reply += (index + 1) + ') <b>' + suggestion.suggestion + '</b> - ' + suggestion.category + '\n';
                    });
                    console.log(reply);
                    bot.sendMessage(cbQuery.message.chat.id, reply, { parse_mode: 'html' });
                })
                .catch((err) => console.log);
            break;
        case 'Choose Category':
            Suggestion.find({ category: cbQuery.data })
                .then((suggestions) => {
                    let reply = '<b><u>Recommendations</u></b>\n\n';
                    suggestions.forEach((suggestion, index) => {
                        reply += (index + 1) + ') <b>' + suggestion.suggestion + '</b> - ' + suggestion.suggestedBy + '\n';
                    });
                    console.log(reply);
                    bot.sendMessage(cbQuery.message.chat.id, reply, { parse_mode: 'html' });
                })
                .catch((err) => console.log);
            break;
    }
    bot.deleteMessage(cbQuery.message.chat.id, cbQuery.message.message_id);
});

