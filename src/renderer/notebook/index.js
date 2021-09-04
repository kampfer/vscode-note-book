// document.body.innerHTML = (new Date()).toString();

import ReactDOM from 'react-dom';
import React from 'react';
import NoteBook from './NoteBook.js';

import './notebook.css';

ReactDOM.render(
    <NoteBook />,
    document.getElementById('app')
);