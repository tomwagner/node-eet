"use strict";

import { Suite } from 'benchmark';

import {
	serializeXMLElement,
	serializeXMLElement2,
	serializeXMLElement3,
	serializeXMLElement4,
	serializeXMLElement5,
	serializeXMLElement6,
	serializeXMLElement7,
} from '../src/xml';
import { parseRequest } from '../src/schema';


// ###
// run in the project root from terminal:
// yarn bench
// ###

const suite = new Suite('serializeXMLElement');

const items = {

	prvniZaslani: true,
	overeni: false,

	dicPopl: 'CZ1212121218',
	idProvoz: 273,
	idPokl: '/554/RO24',

	poradCis: '0/6460/ZQ42',
	datTrzby: new Date(),

	celkTrzba: 12100, // 121 CZK
	zaklDan1: 10000, // 100 CZK
	dan1: 2100, // 21 CZK
	cerpZuct: 12100, // 121 CZK

	rezim: 0,

};

const { header, data } = parseRequest(items);

// add tests

suite.add('(orig) after: sort()', () => {
	serializeXMLElement('Hlavicka', header);
	serializeXMLElement('Data', data);
});


suite.add('(2) before: sort(([a], [b]) => a < b ? -1 : a > b))', () => {
	serializeXMLElement2('Hlavicka', header);
	serializeXMLElement2('Data', data);
});

suite.add('(3) before: sort(([a], [b]) => a.localeCompare(b))', () => {
	serializeXMLElement3('Hlavicka', header);
	serializeXMLElement3('Data', data);
});

suite.add('(4) after: sort((a, b) => a < b ? -1 : a > b))', () => {
	serializeXMLElement4('Hlavicka', header);
	serializeXMLElement4('Data', data);
});

suite.add('(5) before: sort(([a], [b]) => a < b ? -1 : (a > b ? 1 : 0))', () => {
	serializeXMLElement5('Hlavicka', header);
	serializeXMLElement5('Data', data);
});

suite.add('(6) serializeXMLElement6', () => {
	serializeXMLElement6('Hlavicka', header);
	serializeXMLElement6('Data', data);
});

suite.add('(7) serializeXMLElement7', () => {
	serializeXMLElement7('Hlavicka', header);
	serializeXMLElement7('Data', data);
});

// print results

suite.on('cycle', event => {
	console.log(String(event.target));
});

suite.on('complete', () => {
	console.log('Fastest is ' + suite.filter('fastest').map('name'));
});

suite.run();
