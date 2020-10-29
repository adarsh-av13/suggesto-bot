const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const suggestionSchema = new Schema({
    suggestedBy: {
        type: String,
        required: true
    },
    suggestion: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
}, {timestamps: true});

let Suggestion = mongoose.model('Suggestion', suggestionSchema);
module.exports = Suggestion;