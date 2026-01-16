"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultChannel = defaultChannel;
const config_1 = require("../config");
function defaultChannel(items) {
    return {
        title: config_1.config.podcast.title,
        description: config_1.config.podcast.description,
        link: config_1.config.podcast.siteUrl,
        language: config_1.config.podcast.language,
        author: config_1.config.podcast.author,
        email: config_1.config.podcast.email,
        items,
    };
}
