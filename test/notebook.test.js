const NoteBook = require('../src/NoteBook');

test('createNote', () => {

    let noteBook = new NoteBook();

    expect(noteBook._data.notes.index).toEqual(undefined);

    noteBook.createNote('index', 'path/to/index.md');

    expect(noteBook._data.notes.index).toEqual({ name: 'index', path: 'path/to/index.md' });

});

test('deleteNote', () => {

    let noteBook = createNoteBook();

    noteBook.deleteNote('foo');

    expect(noteBook.getNote('foo')).toEqual(undefined);
    expect(noteBook.getLinksBySouce('foo').length).toEqual(0);
    expect(noteBook.getLinksByTarget('foo').length).toEqual(0);

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
