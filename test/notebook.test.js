const NoteBook = require('../src/NoteBook');

test('声明NoteBokk实例时，不传入本地存储文件，notebook自动生成空对象', function () {

    let noteBook = new NoteBook();

    expect(noteBook._data).toEqual({ notes: {} });

});

test('createNote', () => {

    let noteBook = new NoteBook();

    noteBook.createNote('index.md');

    expect(noteBook._data).toEqual({
        notes: {
            'index.md': {}
        }
    });

    noteBook.createNote('foo.md', '/path/to/foo', null, ['./index.md']);

    expect(noteBook._data).toEqual({
        notes: {
            'index.md': {
                path: undefined,
                upLinks: undefined,
                downLinks: undefined,
            },
            'foo.md': {
                path: '/path/to/foo',
                upLinks: ['./index.md'],
                downLinks: null,
            }
        }
    });

});

test('setNote', () => {

    let noteBook = new NoteBook();

    noteBook.createNote('index.md');
    noteBook.createNote('bar.md');

    // 使用setNote创建新note
    noteBook.setNote('baz.md', 'path/to/baz', ['bar.md']);

    expect(noteBook._data.notes['bar.md'].upLinks).toEqual(['baz.md']);

    noteBook.createNote('foo.md', '/path/to/foo');
    noteBook.setNote('foo.md', '/another/path/to/foo', ['bar.md'], ['index.md']);

    expect(noteBook._data.notes['foo.md']).toEqual({
        path: '/another/path/to/foo',
        upLinks: ['index.md'],
        downLinks: ['bar.md'],
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
    expect(noteBook._data.notes['foo.md'].upLinks).toEqual(['index.md']);
    // deleteNote()不处理downlinks信息
    expect(noteBook._data.notes['index.md'].downLinks).toEqual(['bar.md', 'foo.md']);

});