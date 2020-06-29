module.exports = function (md) {

    md.inline.ruler.before('emphasis', 'duplexLink', function (state, silent) {

        if (silent) return false;

        let content = state.src;

        // 0x5b === '['
        if (content.charCodeAt(state.pos) !== 0x5b) return false;

        if (content.charCodeAt(state.pos + 1) !== 0x5b) return false;

        let labelStart = state.pos + 2,
            labelEnd = labelStart,
            findClose = false;

        while (labelEnd < state.posMax) {

            // 0x5d === ']'
            if (content.charCodeAt(labelEnd) === 0x5d && content.charCodeAt(labelEnd + 1) === 0x5d) {
                labelEnd++;
                findClose = true;
                break;
            }

            labelEnd++;

        }

        if (!findClose) return false;

        let title = content.substring(labelStart, labelEnd - 1),
            href = `${title}.md`,
            token;

        // <a href="somePath">title</a>
        // ^^^^^^^^^^^^^^^^^^^
        token = state.push('link_open', 'a', 1);
        token.attrs = [
            ['href', href],
            ['title', title]
        ];

        // <a href="somePath">title</a>
        //                    ^^^^^
        token = state.push('text', '', 0);
        token.content = title;
        token.isDuplexLink = true;

        // <a href="somePath">title</a>
        //                         ^^^^
        token = state.push('link_close', 'a', -1);

        // markdown-it从新pos开始继续分析剩下文档内容
        state.pos = labelEnd + 1;

        return true;

    });

};