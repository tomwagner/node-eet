# eet

[![npm](https://img.shields.io/npm/v/@nfctron/eet.svg?maxAge=2592000)](https://www.npmjs.com/package/@nfctron/eet)
[![eet channel on discord](https://img.shields.io/badge/discord-join%20chat-61dafb.svg)](https://discord.gg/bg3yazg)


Node.js library for EET ([Electronic Registration of Sales](http://www.etrzby.cz/assets/cs/prilohy/EET_popis_rozhrani_v3.1.1_EN.pdf) in the Czech Republic) ([Elektronickou evidenci tržeb](http://www.etrzby.cz/cs/technicka-specifikace)).

> _Note:_ this library is still in development (version 0.x). API should stay the same, but there are not enough tests and documentation.
> **Pull requests are welcome!**


## Differences against the original library

This is fork of [JakubMrozek/eet](https://github.com/JakubMrozek/eet) with the following **changes**:
- **completely rewritten to allow multiple request with the same client (performance improvement)**  
	\+ _currentDate_ and _uuid_ moved from options to **items** and renamed to **datOdesl** and **uuidZpravy** to improve consistency
- fixed LICENSE (to be recognized by GitHub)
- improved README
- added yarn.lock
- improved package.json, upgraded dependencies


## Installation 

> Requirements: **Node.js 7+** (it might work under 6.x but it is not tested)

Using npm:

```bash
npm install @nfctron/eet --save
```

or with yarn:

```bash
yarn add @nfctron/eet
```


## Example usage

```javascript
const { createClient } = require('eet');

// privatni klic a certifikat podnikatele
const options = {
	privateKey: '...',
	certificate: '...',
	playground: true
};

// polozky, ktere se posilaji do EET 
const items = {
	dicPopl: 'CZ1212121218',
	idPokl: '/5546/RO24',
	poradCis: '0/6460/ZQ42',
	datTrzby: new Date(),
	celkTrzba: 34113,
	idProvoz: '273'
};

// ziskani FIK (kod uctenky) pomoci async/await (Node.js 8+ / Babel)

const client = await createClient(options);

try {
	const { fik } = await client.request(items);
}


// ziskani FIK v Node.js 6+
createClient(options)
	.then(client => client.request(items))
	.then(response => {
		// response.fik
	});
```


## Convert .p12 to .pem

**TODO example using command line with OpenSSL**

This library works only with certificates and keys in string format .pem.
From the binary .p12 you can convert them for example by package [pem](https://github.com/andris9/pem):

```bash
npm install pem --save
```

```javascript
const pem = require('pem');

const file = require('fs').readFileSync('cesta/k/souboru.p12');
const password = ''; //pro testovací certifikáty EET je heslo 'eet'

pem.readPkcs12(file, {p12Password: password}, (err, result) => {
	if (err) ...
	// result.key je privátní klíč
	// result.cert je certifikát
});
```


## API


### createClient(options)

|        name         |  type   |                                     required                                      | default |                                                      description                                                       |
|---------------------|---------|-----------------------------------------------------------------------------------|---------|------------------------------------------------------------------------------------------------------------------------|
| **privateKey**      | string  | **yes**                                                                           |         | private key for the certificate                                                                                        |
| **certificate**     | string  | **yes**                                                                           |         | certificate                                                                                                            |
| offline             | boolean | no                                                                                | false   | if true, includes PKP and BKB in response on unsuccessful request to EET                                               |
| playground          | boolean | no                                                                                | false   | use Playground EET endpoint instead of production                                                                      |
| timeout             | number  | no                                                                                | 2000 ms | maximal time to wait in milliseconds                                                                                   |
| measureResponseTime | boolean | no                                                                                | false   | measure response time using node-soap's [client.lastElapsedTime](https://github.com/vpulim/node-soap#options-optional) |
| httpClient          | object  | no                                                                                |         | see [soap options](https://github.com/vpulim/node-soap#options), just for testing                                      |


### EETClient.request(items)

* *items* - data to send in EET request, same name as in EET specification but in camel case (so instead of `dic_popl` use `dicPopl`)

	**TODO** add table of items (required, data type, and description)


TODO document whole API


## Frequent errors

### Neplatny podpis SOAP zpravy (4)

Na 99% půjde o problém s certifikátem, více je popsáno v issue [#1](https://github.com/JakubMrozek/eet/issues/1#issuecomment-256877574).


## Roadmap

- possibly create signatures and hashes asynchronously
- better test coverage
- improve documentation
- and [JakubMrozek/eet #9 Roadmap v1.0](https://github.com/JakubMrozek/eet/issues/9#issue-189261486)


## Changelog

see description of each release in [Releases](https://github.com/NFCtron/eet/releases)


## License

[MIT](/LICENSE.md)
