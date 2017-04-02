# eet

Node.js library for EET ([Electronic Registration of Sales](http://www.etrzby.cz/assets/cs/prilohy/EET_popis_rozhrani_v3.1.1_EN.pdf) in the Czech Republic) ([Elektronickou evidenci tržeb](http://www.etrzby.cz/cs/technicka-specifikace)).

> _Note:_ this library is still in development (version 0.x). API should stay the same, but there are not enough tests and documentation.
> **Pull requests are welcome!**


## Differences against the original library

This is fork of [JakubMrozek/eet](https://github.com/JakubMrozek/eet) with the following **changes**:
- reformatted code
- upgrade dependencies
- improve package.json
- fixed LICENSE (to be recognized by GitHub)
- improved README
- added yarn.lock
- improved package.json
- **Breaking change:** _currentDate_ and _uuid_ moved from options to **items** and renamed to **datOdesl** and **uuidZpravy** to improve consistency


## Installation 

Requirements: Node.js v4+

Using npm

```bash
npm install nfc-pcsc --save
```


## Example usage

```javascript
const eet = require('eet');

// privatni klic a certifikat podnikatele
const options = {
  privateKey: '...',
  certificate: '...',
  playground: true
}

// polozky, ktere se posilaji do EET 
const items = {
  dicPopl: 'CZ1212121218',
  idPokl: '/5546/RO24',
  poradCis: '0/6460/ZQ42',
  datTrzby: new Date(),
  celkTrzba: 34113,
  idProvoz: '273'
}

// ziskani FIK (kod uctenky) pomoci async/await (Node.js 8+ / Babel)
const { fik } = await eet(options, items);

// ziskani FIK v Node.js 6+
eet(options, items).then(response => {
  // response.fik
});
```


## Převod .p12 na .pem

Balíček pracuje s klíči v textovém formátu, z binárního .p12 je lze převést např. pomocí balíčku [pem](https://github.com/andris9/pem):

```javascript
// npm install pem
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

### eet (options, items)

* *options* - Volby pro odesílání požadavku (pro SOAP).
  * *options.privateKey* (string) - Privátní klíč
  * *options.certificate* (string) - Certifikát
  * *options.playground* (bool) - Posílat požadavky na playground? Def. false (ne).
  * *options.httpClient* - Viz [soap options](https://github.com/vpulim/node-soap#options), slouží pro testování.
  * *options.timeout* (number) - Nastavení max. timeoutu (defaultně 2000 ms)
  * *options.offline* (bool) - Do chybové hlášky vkládat PKP a BKP
* *items* - Položky, které se posílají do EET. Mají stejný název jako ve specifikaci EET, jen používají cammel case (tedy místo dic_popl se používá dicPopl)

TODO add table of items (required, data type, and description)


## Frequent errors

### Neplatny podpis SOAP zpravy (4)

Na 99% půjde o problém s certifikátem, více je popsáno v issue [#1](https://github.com/JakubMrozek/eet/issues/1#issuecomment-256877574).


## Roadmap

- possibly performance improvements (create signatures and hashes asynchronously)
- better test coverage
- improve documentation
- improve code


## Changelog

### v0.7 (6. 3. 2017)
- vrácena podpora pro Node.js v4 ([#16](https://github.com/JakubMrozek/eet/pull/16))
- oprava regulárního výrazu pro kontrolu formátu pokladny ([#13](https://github.com/JakubMrozek/eet/pull/13))

### v0.6 (6. 2. 2017)
- doplněna volba `options.offline`
- balíček uuid aktualizován na 3.0

### v0.5 (2. 12. 2016) + v0.5.1
- doplněna možnost určit timeout 

### v0.4 (13. 11. 2016)
- oprava generování PKP ([#6](https://github.com/JakubMrozek/eet/issues/6))
- privátní klíč není potřeba převádět na buffer ([#4](https://github.com/JakubMrozek/eet/pull/4))

### v0.3 (13. 11. 2016)
- doplněny validace
- v odpovědi se vrací warningy

### v0.2 (30. 10. 2016)
- podpora verze Node.js 4+
- doplněna dokumentace (časté chyby a převod z .p12 na .pem pomocí balíčku `pem`)

### v0.1 (20. 10. 2016)
- první veřejná verze


## License

[MIT](/LICENSE.md)
