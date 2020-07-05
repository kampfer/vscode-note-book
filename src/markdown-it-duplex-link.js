// ignoreUndedefinedNote，默认值为false
// true 默认值 - 忽略未定义的笔记，不将其标记识别为duplex link，也不转换成a标签。
module.exports = function (noteBook, ignoreUndefinedNote = false) {

    return function (md) {

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
                note = noteBook.getNote(href),
                isDuplexLink = note || !ignoreUndefinedNote,
                token;

            // note存在，则生成链接。否则生成`[[xxx]]`格式的文本
            // <a href="somePath">title</a>
            // ^^^^^^^^^^^^^^^^^^^
            if (isDuplexLink) {
                token = state.push('link_open', 'a', 1);
                token.attrs = [
                    ['href', href],
                    ['title', title]
                ];
            } else {
                token = state.push('link_open', 'span', 1);
            }

            // <a href="somePath">title</a>
            //                    ^^^^^
            token = state.push('text', '', 0);
            token.content = isDuplexLink ? title : `[[${title}]]`;
            token.isDuplexLink = isDuplexLink;

            // <a href="somePath">title</a>
            //                         ^^^^
            if (isDuplexLink) {
                token = state.push('link_close', 'a', -1);
            } else {
                token = state.push('link_open', 'span', -1);
            }

            // markdown-it从新pos开始继续分析剩下文档内容
            state.pos = labelEnd + 1;

            return true;

        });

    }

}