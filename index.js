const TelegramBot = require('node-telegram-bot-api');
const ReplyKeyboard = require('node-telegram-keyboard-wrapper').ReplyKeyboard;
const InlineKeyboard = require('node-telegram-keyboard-wrapper').InlineKeyboard;
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
const categories = new InlineKeyboard();
categories.addRow({
    text: 'Movie',
    callback_data: 'movie'
});
categories.addRow({
    text: 'Series',
    callback_data: 'series'
});
categories.addRow({
    text: 'Others',
    callback_data: 'others'
});
bot.onText(/\/suggest (.+)/, (msg, match) => {
    sender = msg.from.first_name + ' ' + msg.from.last_name;
    suggestion = match[1];
    console.log(sender, suggestion);
    bot.sendMessage(msg.chat.id, 'Add to Category', categories.build());
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
            const users = new InlineKeyboard();
            suggestors.forEach((suggestor) => {
                users.addRow({ text: suggestor, callback_data: suggestor });
            });
            bot.sendMessage(msg.chat.id, 'Choose User', users.build());
        })
        .catch((err) => console.log);
});

bot.onText(/\/viewbycategory/, (msg, match) => {
    bot.sendMessage(msg.chat.id, 'Choose Category', categories.build());
});

bot.onText(/\/removesuggestion/, (msg, match) => {
    Suggestion.find({ suggestedBy: msg.from.first_name + ' ' + msg.from.last_name })
        .then((suggestions) => {
            const reply = new InlineKeyboard();
            suggestions.forEach((suggestion) => {
                reply.addRow({
                    text: suggestion.suggestion,
                    callback_data: suggestion.suggestion
                });
            });
            bot.sendMessage(msg.chat.id, 'Remove', reply.build());
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
        case 'Remove':
            Suggestion.deleteOne({ suggestedBy: cbQuery.message.chat.first_name + ' ' + cbQuery.message.chat.last_name, suggestion: cbQuery.data })
                .then((_) => {
                    bot.sendMessage(cbQuery.message.chat.id, cbQuery.message.chat.first_name + ' ' + cbQuery.message.chat.last_name + ' removed <b>' + cbQuery.data + '</b> ', { parse_mode: 'html' });
                })
                .catch((err) => {
                    bot.sendMessage(cbQuery.message.chat.id, 'An error occured. Please try again later.');
                });
            break;
    }
    bot.deleteMessage(cbQuery.message.chat.id, cbQuery.message.message_id);
});

