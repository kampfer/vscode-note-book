const markdownItMermaid = require('markdown-it-mermaid-plugin');
const markdownItCodepen = require('markdown-it-codepen');
const markdownItTexmath = require('markdown-it-texmath');
const markdownItMarkmap = require('markdown-it-markmap2');
const duplexLinkPlugin = require('./markdown-it-duplex-link');
const katex = require('katex');

module.exports = function (md, noteBook) {

    return md.use(markdownItCodepen)
        .use(markdownItMarkmap)
        .use(markdownItMermaid)
        .use(duplexLinkPlugin(noteBook, true))
        .use(markdownItTexmath, {
            engine: katex,
            delimiters: 'julia',
            katexOptions: { macros: { '\\RR': '\\mathbb{R}' } }
        });

}
