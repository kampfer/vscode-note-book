const NoteBook = require('../src/NoteBook');

test('createNote', () => {

    let noteBook = new NoteBook();

    expect(noteBook._data.notes.index).toEqual(undefined);

    noteBook.createNote('index', 'path/to/index.md');

    expect(noteBook._data.notes.index).toEqual({ name: 'index', path: 'path/to/index.md' });

});

test('setNote', () => {

    let noteBook = new NoteBook();

    noteBook.createNote('index.md');
    noteBook.createNote('bar.md');

    // 使用setNote创建新note
    noteBook.setNote('baz.md', 'path/to/baz', ['bar.md']);

    expect(noteBook._data.notes['bar.md'].upLinks).toEqual([{ target: 'baz.md' }]);

    noteBook.createNote('foo.md', '/path/to/foo');
    noteBook.setNote('foo.md', '/another/path/to/foo', ['bar.md'], ['index.md']);

    expect(noteBook._data.notes['foo.md']).toEqual({
        path: '/another/path/to/foo',
        upLinks: [{ target: 'index.md' }],
        downLinks: [{ target: 'bar.md' }],
    });
    // 使用setNote()方法可以添加关联note的信息
    expect(noteBook._data.notes['index.md'].downLinks).toEqual(['foo.md']);
    expect(noteBook._data.notes['bar.md'].upLinks).toEqual(['baz.md', 'foo.md']);

    // 显式的传入空数组可以删除关联note的信息
    noteBook.setNote('foo.md', '/another/path/to/foo', [], []);

    expect(noteBook._data.notes['foo.md']).toEqual({
        path: '/another/path/to/foo',
        upLinks: [],
        downLinks: [],
    });
    expect(noteBook._data.notes['index.md'].downLinks).toEqual([]);
    expect(noteBook._data.notes['bar.md'].upLinks).toEqual(['baz.md']);


});

test('deleteNote', () => {

    let noteBook = new NoteBook();

    noteBook.createNote('foo.md', '/path/to/foo');
    noteBook.setNote('bar.md', 'path/to/bar', ['foo.md']);
    noteBook.setNote('index.md', 'path/to/index', ['bar.md', 'foo.md']);

    noteBook.deleteNote('bar.md');

    // bar.md被删除
    expect(noteBook._data.notes['bar.md']).toEqual(undefined);
    // deleteNote()处理uplinks信息
    expect(noteBook._data.notes['foo.md'].upLinks).toEqual([{ target: 'index.md' }]);
    // deleteNote()不处理downlinks信息
    expect(noteBook._data.notes['index.md'].downLinks).toEqual([{ target: 'bar.md' }, { target: 'foo.md' }]);

});

test('addLink', () => {

    let noteBook = new NoteBook();

    noteBook.createNote('index', 'path/to/index');
    noteBook.createNote('foo', 'path/to/foo');

    noteBook.addLink('index', 'foo', 'some text');

    expect(noteBook._data.links[0]).toEqual({ source: 'index', target: 'foo', context: 'some text' });

});

function createNoteBook() {

    let noteBook = new NoteBook();

    noteBook.createNote('index', 'path/to/index');
    noteBook.createNote('foo', 'path/to/foo');
    noteBook.createNote('bar', 'path/to/bar');
    noteBook.createNote('baz', 'path/to/baz');

    noteBook.addLink('index', 'foo', 'index->foo');
    noteBook.addLink('index', 'bar', 'index->bar');
    noteBook.addLink('index', 'baz', 'index->baz');
    noteBook.addLink('foo', 'baz', 'foo->bar');

    return noteBook;

}

test('getLinksBySouce', () => {

    let noteBook = createNoteBook(),
        links = noteBook.getLinksBySouce('index');

    expect(links.length).toEqual(3);
    expect(links.map(link => link.source)).toEqual(['index', 'index', 'index']);
    expect(links.map(link => link.target)).toEqual(['foo', 'bar', 'baz']);
    expect(links.map(link => link.context)).toEqual(['index->foo', 'index->bar', 'index->baz']);

});

test('getLinksByTarget', () => {

    let noteBook = createNoteBook(),
        links = noteBook.getLinksByTarget('baz');

    expect(links.length).toEqual(2);
    expect(links.map(link => link.source)).toEqual(['index', 'foo']);
    expect(links.map(link => link.target)).toEqual(['baz', 'baz']);
    expect(links.map(link => link.context)).toEqual(['index->baz', 'foo->bar']);

});

test('getLinkBySourceTarget', () => {

    let noteBook = createNoteBook(),
        link = noteBook.getLinkBySourceTarget('index', 'baz');

    expect(link).toEqual({source: 'index', target: 'baz', context: 'index->baz'});

});

test('deleteLinksBySource', () => {

    let noteBook = createNoteBook();

    noteBook.deleteLinksBySource('index');

    expect(noteBook.getLinksBySouce('index').length).toEqual(0);

});

test('deleteLinksByTarget', () => {

    let noteBook = createNoteBook();

    noteBook.deleteLinksByTarget('baz');

    expect(noteBook.getLinksByTarget('baz').length).toEqual(0);

});

test('deleteLinkBySourceTarget', () => {

    let noteBook = createNoteBook();

    noteBook.deleteLinkBySourceTarget('index', 'baz');

    expect(noteBook.getLinkBySourceTarget('index', 'baz')).toEqual(undefined);

});
