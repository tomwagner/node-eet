"use strict";

import fs from 'fs';
import test from 'ava';
import * as crypto from '../src/crypto';
import * as utils from '../src/utils';
import * as schema from '../src/schema';
import * as errors from '../src/errors';
import { RequestParsingError, ResponseServerError } from '../src/errors';
import * as xml from '../src/xml';
import * as eet from '../src/index';


const PRIVATE_KEY = fs.readFileSync('./test/certificate-CZ1212121218/private.pem');
const FAKE_PRIVATE_KEY = fs.readFileSync('./test/certificate-CZ1212121218/fake-private.pem');
const CERTIFICATE = fs.readFileSync('./test/certificate-CZ1212121218/certificate.pem');
const TEST_PKP = 'QEIvS/3ETSJuAK7agvrVlQUN1Oi4DoPrNBmC+sQueNknhsr48RGElLpzTnxH/KUdfde91xFOcRbgyiXapK4beRTRaZ/CQ1qug4Y7JbnhB60WUH61E2NlTzxTfmidcNIlQohrVDC5awyrZQj2T1cG+3gGPHQ/oveM4ozt5gLaHFDwl421eLQctxeQfXK4dDrZDANX6AVB8Q92X89o9YouISCjIrYk7ZnLhDe+cXxlB0GGJq5i1P2uALOgQyZBU5mBWLolL2n06C73Sja7HjCt9E8s6bV9y1cJZcjXo1tWOEUqfU8ir/wYstO11v/JmiRADGwGoCuCszktUmf4K3PaDg==';
const TEST_BKP = 'b8f8392b-f73c8643-0ba0c171-142caa01-4c7a4078';


test('generatePKP', t => {

	const result = crypto.generatePKP(PRIVATE_KEY, {
		dic_popl: 'CZ1212121218',
		id_provoz: '273',
		id_pokl: '/5546/RO24',
		porad_cis: '0/6460/ZQ42',
		dat_trzby: '2016-08-05T00:30:12+02:00',
		celk_trzba: '34113.00',
	});

	t.is(result, TEST_PKP);

});

test('generateBKP', t => {
	t.is(crypto.generateBKP(TEST_PKP), TEST_BKP);
});

test('convertDateToString', t => {

	const date = new Date('2016-08-05T00:30:12+02:00');

	t.is(utils.convertDateToString(date), '2016-08-04T22:30:12Z');

});

test('convertAmountToString positive', t => {
	t.is(utils.convertAmountToString(1200), '12.00');
});

test('convertAmountToString negative', t => {
	t.is(utils.convertAmountToString(-123456), '-1234.56');
});

test('convertAmountToString 0.12', t => {
	t.is(utils.convertAmountToString(12), '0.12');
});

test('convertAmountToString 0.01', t => {
	t.is(utils.convertAmountToString(1), '0.01');
});

test('parseRequest', t => {

	const result = schema.parseRequest({
		dicPopl: 'CZ1212121218',
		idPokl: '/5546/RO24',
		poradCis: '0/6460/ZQ42',
		datTrzby: new Date('2016-08-05T00:30:12+02:00'),
		celkTrzba: -3411380,
		idProvoz: 273,
	});

	const expected = {
		dic_popl: 'CZ1212121218',
		id_pokl: '/5546/RO24',
		porad_cis: '0/6460/ZQ42',
		dat_trzby: '2016-08-04T22:30:12Z',
		celk_trzba: '-34113.80',
		id_provoz: '273',
		rezim: '0',
	};

	t.deepEqual(result.data, expected);

});

test('parseRequest null', t => {
	t.throws(() => schema.parseRequest(null), { instanceOf: RequestParsingError });
});

test('parseRequest valid', t => {

	t.notThrows(() => schema.parseRequest({
		dicPopl: 'CZ1212121218',
		dicPoverujiciho: 'CZ1212121218',
		idPokl: '1',
		idProvoz: 1,
		poradCis: '2016-0001s',
		datTrzby: new Date(),
		celkTrzba: 1000,
	}));

});

test('parseRequest wrong type', t => {

	t.throws(() => schema.parseRequest({
		dicPopl: 'CZ1212121218',
		idPokl: '1',
		idProvoz: 1,
		poradCis: '2016-0001s',
		datTrzby: new Date(),
		celkTrzba: 'abc',
	}), { instanceOf: RequestParsingError });

});

test('parseRequest missing required', t => {

	t.throws(() => schema.parseRequest({
		idPokl: '1',
		idProvoz: 1,
		poradCis: '2016-0001s',
		datTrzby: new Date(),
		celkTrzba: 1000,
	}), { instanceOf: RequestParsingError });

});

test('validateVatId', t => {
	t.truthy(utils.validateCzVatId('CZ1212121218'));
	t.falsy(utils.validateCzVatId(1212121218));
});

test('validateIdProvoz', t => {
	t.truthy(utils.validateIdProvoz(25));
	t.falsy(utils.validateIdProvoz(12345678));
});

test('validateIdPokl', t => {
	t.truthy(utils.validateIdPokl('0aA.,:;/#-_'));
	t.falsy(utils.validateIdPokl('@@@'));
});

test('validatePoradCis', t => {
	t.truthy(utils.validatePoradCis('0aA.,:;/#-_'));
	t.falsy(utils.validatePoradCis('@@@'));
});

test('validateAmount', t => {

	t.truthy(utils.validateAmount(1000));
	t.truthy(utils.validateAmount(0));
	t.truthy(utils.validateAmount(-1000));
	t.falsy(utils.validateAmount(78.8));
	t.falsy(utils.validateAmount('1000.00'));
	t.falsy(utils.validateAmount('1000,00'));
	t.falsy(utils.validateAmount('test'));

});

test('serializeKontrolniKody', t => {

	const expected = `<KontrolniKody><pkp cipher="RSA2048" digest="SHA256" encoding="base64">${TEST_PKP}</pkp><bkp digest="SHA1" encoding="base16">${TEST_BKP}</bkp></KontrolniKody>`;

	t.is(xml.serializeKontrolniKody({ pkp: TEST_PKP, bkp: TEST_BKP }), expected);

});

test('parseResponseXML correct', async t => {

	const response = `<soap:Envelope xmlns:eet="http://fs.mfcr.cz/eet/schema/v3"  xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Header><wsse:Security soap:mustUnderstand="1"><wsse:BinarySecurityToken wsu:Id="SecurityToken-d9ed076c-3142-4821-bcdb-46bcf8ef3233" EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3">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</wsse:BinarySecurityToken><Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
<SignedInfo>
  <CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
  <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256" />
  <Reference URI="#Body-6c1fe7bd-83d3-4349-98a1-46bcf8ef713f">
    <Transforms>
      <Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
    </Transforms>
    <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
    <DigestValue>rGvViOJNGsm4A/7SuqmU7FxcqA8esxsis0J/JtHxWlY=</DigestValue>
  </Reference>
</SignedInfo>
<SignatureValue>Q+kGGtFas2+8asw6t05S6aUJ6fsWYraLUwFFfowsVTi1X/OClM893shH0a8TmgqY5fRZeklIw4LppVLgaBZkFm4w9bgn3FbCNrFp2rYM3r8t7G6VfWhmWQGzIhtoIolnY46iXefn39AibhoEWgnXbRt6/IgpqXpwGS8Ahwc4GJHJvhHOG9AztVFzVgpR5FGkwZW6jGUJPQuX871PHGkEbVD6SAWnixPiNqfGvt72hfMutXvlOC2EZMDF/4EG0raf+V3LCxvLtHRYW3RqaglaK28rPYrmUOrzImhAkgKTA99GborB/qeTwZEQWo13b+kx07sTStusy1AuKj60y2L1+w==</SignatureValue><KeyInfo><wsse:SecurityTokenReference xmlns=""><wsse:Reference URI="#SecurityToken-d9ed076c-3142-4821-bcdb-46bcf8ef3233" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3" /></wsse:SecurityTokenReference></KeyInfo></Signature></wsse:Security></soap:Header><soap:Body wsu:Id="Body-6c1fe7bd-83d3-4349-98a1-46bcf8ef713f">
<eet:Odpoved>
	<eet:Hlavicka uuid_zpravy="ae0af488-5115-48c0-8d10-0861a2921981" bkp="6d8adb2d-a3a20e55-b78e8168-b240c580-38c71f7d" dat_prij="2020-03-05T19:56:02+01:00" />
	<eet:Potvrzeni fik="f741687f-61c8-4672-917a-46bcf8eff62d-fa" test="true" />
</eet:Odpoved></soap:Body></soap:Envelope>`;

	const parsed = xml.parseResponseXML(response);

	const expected = {
		uuid: 'ae0af488-5115-48c0-8d10-0861a2921981',
		bkp: '6d8adb2d-a3a20e55-b78e8168-b240c580-38c71f7d',
		fik: 'f741687f-61c8-4672-917a-46bcf8eff62d-fa',
		test: 'true',
		datPrij: '2020-03-05T19:56:02+01:00',
	};

	t.deepEqual(xml.extractResponse(parsed), expected);

});

test('parseResponseXML warning single', async t => {

	const response = `<soap:Envelope xmlns:eet="http://fs.mfcr.cz/eet/schema/v3"  xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Header><wsse:Security soap:mustUnderstand="1"><wsse:BinarySecurityToken wsu:Id="SecurityToken-d9ed076c-3142-4821-bcdb-46bcf8ef3233" EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3">MIIIEzCCBfugAwIBAgIEALAJuDANBgkqhkiG9w0BAQsFADB/MQswCQYDVQQGEwJDWjEoMCYGA1UEAwwfSS5DQSBRdWFsaWZpZWQgMiBDQS9SU0EgMDIvMjAxNjEtMCsGA1UECgwkUHJ2bsOtIGNlcnRpZmlrYcSNbsOtIGF1dG9yaXRhLCBhLnMuMRcwFQYDVQQFEw5OVFJDWi0yNjQzOTM5NTAeFw0xOTA2MTcwODI4NDdaFw0yMDA2MTYwODI4NDdaMIG+MTowOAYDVQQDDDFHRsWYIC0gZWxla3Ryb25pY2vDoSBldmlkZW5jZSB0csW+ZWIgLSBQbGF5Z3JvdW5kMQswCQYDVQQGEwJDWjFBMD8GA1UECgw4xIxlc2vDoSByZXB1Ymxpa2EgLSBHZW5lcsOhbG7DrSBmaW5hbsSNbsOtIMWZZWRpdGVsc3R2w60xFzAVBgNVBGEMDk5UUkNaLTcyMDgwMDQzMRcwFQYDVQQFEw5JQ0EgLSAxMDQ2ODQ3NzCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALYkVUhVJ2K05BxD1jLr/ArIKXhyQIKpfrV5C4tS2iYEto9yWjTtAIh9XMdKUbpPew0gXpzyv2sErrH1GARdyVCYNnYhEoNilv0Sk2x25p06Tfki5OFZcfB0OeAZ8ZnG2gs6RRuEy8jrWu8f9rAO1pxJnhOC/tjFYVHZjc+FMux18mzPEUpORqWVQbpL6n9CzJFcp/5Syy2DF92QxQPitQP9olJE3sDK+Rs7kVH2doneXGw0mfMoeyR0sZPfJLC4nJxoLRLLZYb3cc472rUF/BPW5INTTXgay6/QxwW2zI+Ce/TGt3hmGsD6P/rfAlJSBNfgIyrIQjvBXCBsC0SGvGECAwEAAaOCA1UwggNRMDgGA1UdEQQxMC+BE2Vwb2Rwb3JhQGZzLm1mY3IuY3qgGAYKKwYBBAGBuEgEBqAKDAgxMDQ2ODQ3NzAOBgNVHQ8BAf8EBAMCBsAwCQYDVR0TBAIwADCCASMGA1UdIASCARowggEWMIIBBwYNKwYBBAGBuEgKAR8BADCB9TAdBggrBgEFBQcCARYRaHR0cDovL3d3dy5pY2EuY3owgdMGCCsGAQUFBwICMIHGGoHDVGVudG8ga3ZhbGlmaWtvdmFueSBjZXJ0aWZpa2F0IHBybyBlbGVrdHJvbmlja291IHBlY2V0IGJ5bCB2eWRhbiB2IHNvdWxhZHUgcyBuYXJpemVuaW0gRVUgYy4gOTEwLzIwMTQuVGhpcyBpcyBhIHF1YWxpZmllZCBjZXJ0aWZpY2F0ZSBmb3IgZWxlY3Ryb25pYyBzZWFsIGFjY29yZGluZyB0byBSZWd1bGF0aW9uIChFVSkgTm8gOTEwLzIwMTQuMAkGBwQAi+xAAQEwgY8GA1UdHwSBhzCBhDAqoCigJoYkaHR0cDovL3FjcmxkcDEuaWNhLmN6LzJxY2ExNl9yc2EuY3JsMCqgKKAmhiRodHRwOi8vcWNybGRwMi5pY2EuY3ovMnFjYTE2X3JzYS5jcmwwKqAooCaGJGh0dHA6Ly9xY3JsZHAzLmljYS5jei8ycWNhMTZfcnNhLmNybDCBhAYIKwYBBQUHAQMEeDB2MAgGBgQAjkYBATBVBgYEAI5GAQUwSzAsFiZodHRwOi8vd3d3LmljYS5jei9acHJhdnktcHJvLXV6aXZhdGVsZRMCY3MwGxYVaHR0cDovL3d3dy5pY2EuY3ovUERTEwJlbjATBgYEAI5GAQYwCQYHBACORgEGAjBlBggrBgEFBQcBAQRZMFcwKgYIKwYBBQUHMAKGHmh0dHA6Ly9xLmljYS5jei8ycWNhMTZfcnNhLmNlcjApBggrBgEFBQcwAYYdaHR0cDovL29jc3AuaWNhLmN6LzJxY2ExNl9yc2EwHwYDVR0jBBgwFoAUdIIIkePZZGhxhdbrMeRy34smsW0wHQYDVR0OBBYEFJ8TA3USRUAGoUg4kk47nNT5ANTlMBMGA1UdJQQMMAoGCCsGAQUFBwMEMA0GCSqGSIb3DQEBCwUAA4ICAQCr7vxB4WckYz6zuex0QKV5u2EeU0iuATWIbl09evr/uBFmaDdXePsn6XJpiOL1YsvbFE9k5KGtZ0BxJE/ebyclrqHuOnZUZyRM7Tnt+xcY8nWjCcci3milI9CW8fY2XDDkLW5+oCta30SUhfe8+U8UeM6DSEHM9zgtM5W5mDIsD6fgQZJlGuHqYICdxro2scrA0+ShIcElUov16NxAhGoMMCzPTqyrtHMRkRQKSAeTY/QmX2ZoIca6tVx+1dLRuuGI80u9s4b/HhV6SVxDbiEiSYRa+cu2Fh7j5XwdwkOHrb5koPv/Dr2/iel7xuYoxOeh29dF3nFvrxPKbTo/eFc9xjPYz6oMfdg2alVjScRcLj8nIvrE5jLSnGQQvQ6TDkhg8aflWJ0GBqYdwkTGHGSemfZe2v37Aa5SuzdBkaD4rsORemNFahq884YicZ1JEHX0eGqcDLwNKA7zgavreYxoamrcj3OPmZJAdm2KGrN7k3BUPKCr8Yro8OlZWNMkdwspszl7rCnAs/vSPzkbaPtt3YSsyOtTKEmFqI+aXc/XtaGyxzrzjXfSA87C01NbE8iN0XFbmOy6kT9xtNm/mZAa1+JMyFfoXSRFjtT5jdSg46hqiYnQ/koJGS+BJzLq+ZZypo+fnQubcHyFta/nBKhFiv4T9gabyu2Lo0nwUi73gg==</wsse:BinarySecurityToken><Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
<SignedInfo>
  <CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
  <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256" />
  <Reference URI="#Body-6c1fe7bd-83d3-4349-98a1-46bcf8ef713f">
    <Transforms>
      <Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
    </Transforms>
    <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
    <DigestValue>rGvViOJNGsm4A/7SuqmU7FxcqA8esxsis0J/JtHxWlY=</DigestValue>
  </Reference>
</SignedInfo>
<SignatureValue>Q+kGGtFas2+8asw6t05S6aUJ6fsWYraLUwFFfowsVTi1X/OClM893shH0a8TmgqY5fRZeklIw4LppVLgaBZkFm4w9bgn3FbCNrFp2rYM3r8t7G6VfWhmWQGzIhtoIolnY46iXefn39AibhoEWgnXbRt6/IgpqXpwGS8Ahwc4GJHJvhHOG9AztVFzVgpR5FGkwZW6jGUJPQuX871PHGkEbVD6SAWnixPiNqfGvt72hfMutXvlOC2EZMDF/4EG0raf+V3LCxvLtHRYW3RqaglaK28rPYrmUOrzImhAkgKTA99GborB/qeTwZEQWo13b+kx07sTStusy1AuKj60y2L1+w==</SignatureValue><KeyInfo><wsse:SecurityTokenReference xmlns=""><wsse:Reference URI="#SecurityToken-d9ed076c-3142-4821-bcdb-46bcf8ef3233" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3" /></wsse:SecurityTokenReference></KeyInfo></Signature></wsse:Security></soap:Header><soap:Body wsu:Id="Body-6c1fe7bd-83d3-4349-98a1-46bcf8ef713f">
<eet:Odpoved>
	<eet:Hlavicka uuid_zpravy="ae0af488-5115-48c0-8d10-0861a2921981" bkp="6d8adb2d-a3a20e55-b78e8168-b240c580-38c71f7d" dat_prij="2020-03-05T19:56:02+01:00" />
	<eet:Potvrzeni fik="f741687f-61c8-4672-917a-46bcf8eff62d-fa" test="true" />
	<eet:Varovani kod_varov="1">DIC poplatnika v datove zprave se neshoduje s DIC v certifikatu</eet:Varovani>
</eet:Odpoved></soap:Body></soap:Envelope>`;

	const parsed = xml.parseResponseXML(response);

	const expected = [{
		message: 'DIC poplatnika v datove zprave se neshoduje s DIC v certifikatu',
		code: '1',
	}];

	t.deepEqual(xml.extractResponse(parsed).warnings, expected);

});

test('parseResponseXML warning multiple', async t => {

	const response = `<soap:Envelope xmlns:eet="http://fs.mfcr.cz/eet/schema/v3"  xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Header><wsse:Security soap:mustUnderstand="1"><wsse:BinarySecurityToken wsu:Id="SecurityToken-d9ed076c-3142-4821-bcdb-46bcf8ef3233" EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3">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</wsse:BinarySecurityToken><Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
<SignedInfo>
  <CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
  <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256" />
  <Reference URI="#Body-6c1fe7bd-83d3-4349-98a1-46bcf8ef713f">
    <Transforms>
      <Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
    </Transforms>
    <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
    <DigestValue>rGvViOJNGsm4A/7SuqmU7FxcqA8esxsis0J/JtHxWlY=</DigestValue>
  </Reference>
</SignedInfo>
<SignatureValue>Q+kGGtFas2+8asw6t05S6aUJ6fsWYraLUwFFfowsVTi1X/OClM893shH0a8TmgqY5fRZeklIw4LppVLgaBZkFm4w9bgn3FbCNrFp2rYM3r8t7G6VfWhmWQGzIhtoIolnY46iXefn39AibhoEWgnXbRt6/IgpqXpwGS8Ahwc4GJHJvhHOG9AztVFzVgpR5FGkwZW6jGUJPQuX871PHGkEbVD6SAWnixPiNqfGvt72hfMutXvlOC2EZMDF/4EG0raf+V3LCxvLtHRYW3RqaglaK28rPYrmUOrzImhAkgKTA99GborB/qeTwZEQWo13b+kx07sTStusy1AuKj60y2L1+w==</SignatureValue><KeyInfo><wsse:SecurityTokenReference xmlns=""><wsse:Reference URI="#SecurityToken-d9ed076c-3142-4821-bcdb-46bcf8ef3233" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3" /></wsse:SecurityTokenReference></KeyInfo></Signature></wsse:Security></soap:Header><soap:Body wsu:Id="Body-6c1fe7bd-83d3-4349-98a1-46bcf8ef713f">
<eet:Odpoved>
	<eet:Hlavicka uuid_zpravy="ae0af488-5115-48c0-8d10-0861a2921981" bkp="6d8adb2d-a3a20e55-b78e8168-b240c580-38c71f7d" dat_prij="2020-03-05T19:56:02+01:00" />
	<eet:Potvrzeni fik="f741687f-61c8-4672-917a-46bcf8eff62d-fa" test="true" />
	<eet:Varovani kod_varov="1">DIC poplatnika v datove zprave se neshoduje s DIC v certifikatu</eet:Varovani>
	<eet:Varovani kod_varov="2" >Chybny format DIC poverujiciho poplatnika</eet:Varovani>
	<eet:Varovani kod_varov="3" >Chybna hodnota PKP</eet:Varovani>
</eet:Odpoved></soap:Body></soap:Envelope>`;

	const parsed = xml.parseResponseXML(response);

	const expected = [
		{
			message: 'DIC poplatnika v datove zprave se neshoduje s DIC v certifikatu',
			code: '1',
		},
		{
			message: 'Chybny format DIC poverujiciho poplatnika',
			code: '2',
		},
		{
			message: 'Chybna hodnota PKP',
			code: '3',
		}];

	t.deepEqual(xml.extractResponse(parsed).warnings, expected);

});

test('parseResponseXML ResponseServerError', async t => {

	const response = `<soap:Envelope xmlns:eet="http://fs.mfcr.cz/eet/schema/v3"  xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Header><wsse:Security soap:mustUnderstand="1"><wsse:BinarySecurityToken wsu:Id="SecurityToken-d9ed076c-3142-4821-bcdb-46bcf8ef3233" EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3">MIIIEzCCBfugAwIBAgIEALAJuDANBgkqhkiG9w0BAQsFADB/MQswCQYDVQQGEwJDWjEoMCYGA1UEAwwfSS5DQSBRdWFsaWZpZWQgMiBDQS9SU0EgMDIvMjAxNjEtMCsGA1UECgwkUHJ2bsOtIGNlcnRpZmlrYcSNbsOtIGF1dG9yaXRhLCBhLnMuMRcwFQYDVQQFEw5OVFJDWi0yNjQzOTM5NTAeFw0xOTA2MTcwODI4NDdaFw0yMDA2MTYwODI4NDdaMIG+MTowOAYDVQQDDDFHRsWYIC0gZWxla3Ryb25pY2vDoSBldmlkZW5jZSB0csW+ZWIgLSBQbGF5Z3JvdW5kMQswCQYDVQQGEwJDWjFBMD8GA1UECgw4xIxlc2vDoSByZXB1Ymxpa2EgLSBHZW5lcsOhbG7DrSBmaW5hbsSNbsOtIMWZZWRpdGVsc3R2w60xFzAVBgNVBGEMDk5UUkNaLTcyMDgwMDQzMRcwFQYDVQQFEw5JQ0EgLSAxMDQ2ODQ3NzCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALYkVUhVJ2K05BxD1jLr/ArIKXhyQIKpfrV5C4tS2iYEto9yWjTtAIh9XMdKUbpPew0gXpzyv2sErrH1GARdyVCYNnYhEoNilv0Sk2x25p06Tfki5OFZcfB0OeAZ8ZnG2gs6RRuEy8jrWu8f9rAO1pxJnhOC/tjFYVHZjc+FMux18mzPEUpORqWVQbpL6n9CzJFcp/5Syy2DF92QxQPitQP9olJE3sDK+Rs7kVH2doneXGw0mfMoeyR0sZPfJLC4nJxoLRLLZYb3cc472rUF/BPW5INTTXgay6/QxwW2zI+Ce/TGt3hmGsD6P/rfAlJSBNfgIyrIQjvBXCBsC0SGvGECAwEAAaOCA1UwggNRMDgGA1UdEQQxMC+BE2Vwb2Rwb3JhQGZzLm1mY3IuY3qgGAYKKwYBBAGBuEgEBqAKDAgxMDQ2ODQ3NzAOBgNVHQ8BAf8EBAMCBsAwCQYDVR0TBAIwADCCASMGA1UdIASCARowggEWMIIBBwYNKwYBBAGBuEgKAR8BADCB9TAdBggrBgEFBQcCARYRaHR0cDovL3d3dy5pY2EuY3owgdMGCCsGAQUFBwICMIHGGoHDVGVudG8ga3ZhbGlmaWtvdmFueSBjZXJ0aWZpa2F0IHBybyBlbGVrdHJvbmlja291IHBlY2V0IGJ5bCB2eWRhbiB2IHNvdWxhZHUgcyBuYXJpemVuaW0gRVUgYy4gOTEwLzIwMTQuVGhpcyBpcyBhIHF1YWxpZmllZCBjZXJ0aWZpY2F0ZSBmb3IgZWxlY3Ryb25pYyBzZWFsIGFjY29yZGluZyB0byBSZWd1bGF0aW9uIChFVSkgTm8gOTEwLzIwMTQuMAkGBwQAi+xAAQEwgY8GA1UdHwSBhzCBhDAqoCigJoYkaHR0cDovL3FjcmxkcDEuaWNhLmN6LzJxY2ExNl9yc2EuY3JsMCqgKKAmhiRodHRwOi8vcWNybGRwMi5pY2EuY3ovMnFjYTE2X3JzYS5jcmwwKqAooCaGJGh0dHA6Ly9xY3JsZHAzLmljYS5jei8ycWNhMTZfcnNhLmNybDCBhAYIKwYBBQUHAQMEeDB2MAgGBgQAjkYBATBVBgYEAI5GAQUwSzAsFiZodHRwOi8vd3d3LmljYS5jei9acHJhdnktcHJvLXV6aXZhdGVsZRMCY3MwGxYVaHR0cDovL3d3dy5pY2EuY3ovUERTEwJlbjATBgYEAI5GAQYwCQYHBACORgEGAjBlBggrBgEFBQcBAQRZMFcwKgYIKwYBBQUHMAKGHmh0dHA6Ly9xLmljYS5jei8ycWNhMTZfcnNhLmNlcjApBggrBgEFBQcwAYYdaHR0cDovL29jc3AuaWNhLmN6LzJxY2ExNl9yc2EwHwYDVR0jBBgwFoAUdIIIkePZZGhxhdbrMeRy34smsW0wHQYDVR0OBBYEFJ8TA3USRUAGoUg4kk47nNT5ANTlMBMGA1UdJQQMMAoGCCsGAQUFBwMEMA0GCSqGSIb3DQEBCwUAA4ICAQCr7vxB4WckYz6zuex0QKV5u2EeU0iuATWIbl09evr/uBFmaDdXePsn6XJpiOL1YsvbFE9k5KGtZ0BxJE/ebyclrqHuOnZUZyRM7Tnt+xcY8nWjCcci3milI9CW8fY2XDDkLW5+oCta30SUhfe8+U8UeM6DSEHM9zgtM5W5mDIsD6fgQZJlGuHqYICdxro2scrA0+ShIcElUov16NxAhGoMMCzPTqyrtHMRkRQKSAeTY/QmX2ZoIca6tVx+1dLRuuGI80u9s4b/HhV6SVxDbiEiSYRa+cu2Fh7j5XwdwkOHrb5koPv/Dr2/iel7xuYoxOeh29dF3nFvrxPKbTo/eFc9xjPYz6oMfdg2alVjScRcLj8nIvrE5jLSnGQQvQ6TDkhg8aflWJ0GBqYdwkTGHGSemfZe2v37Aa5SuzdBkaD4rsORemNFahq884YicZ1JEHX0eGqcDLwNKA7zgavreYxoamrcj3OPmZJAdm2KGrN7k3BUPKCr8Yro8OlZWNMkdwspszl7rCnAs/vSPzkbaPtt3YSsyOtTKEmFqI+aXc/XtaGyxzrzjXfSA87C01NbE8iN0XFbmOy6kT9xtNm/mZAa1+JMyFfoXSRFjtT5jdSg46hqiYnQ/koJGS+BJzLq+ZZypo+fnQubcHyFta/nBKhFiv4T9gabyu2Lo0nwUi73gg==</wsse:BinarySecurityToken><Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
<SignedInfo>
  <CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
  <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256" />
  <Reference URI="#Body-6c1fe7bd-83d3-4349-98a1-46bcf8ef713f">
    <Transforms>
      <Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
    </Transforms>
    <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
    <DigestValue>rGvViOJNGsm4A/7SuqmU7FxcqA8esxsis0J/JtHxWlY=</DigestValue>
  </Reference>
</SignedInfo>
<SignatureValue>Q+kGGtFas2+8asw6t05S6aUJ6fsWYraLUwFFfowsVTi1X/OClM893shH0a8TmgqY5fRZeklIw4LppVLgaBZkFm4w9bgn3FbCNrFp2rYM3r8t7G6VfWhmWQGzIhtoIolnY46iXefn39AibhoEWgnXbRt6/IgpqXpwGS8Ahwc4GJHJvhHOG9AztVFzVgpR5FGkwZW6jGUJPQuX871PHGkEbVD6SAWnixPiNqfGvt72hfMutXvlOC2EZMDF/4EG0raf+V3LCxvLtHRYW3RqaglaK28rPYrmUOrzImhAkgKTA99GborB/qeTwZEQWo13b+kx07sTStusy1AuKj60y2L1+w==</SignatureValue><KeyInfo><wsse:SecurityTokenReference xmlns=""><wsse:Reference URI="#SecurityToken-d9ed076c-3142-4821-bcdb-46bcf8ef3233" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3" /></wsse:SecurityTokenReference></KeyInfo></Signature></wsse:Security></soap:Header><soap:Body wsu:Id="Body-6c1fe7bd-83d3-4349-98a1-46bcf8ef713f">
<eet:Odpoved>
	<eet:Hlavicka uuid_zpravy="ae0af488-5115-48c0-8d10-0861a2921981" bkp="6d8adb2d-a3a20e55-b78e8168-b240c580-38c71f7d" dat_odmit="2020-03-05T19:56:02+01:00" />
	<eet:Chyba kod="5">Neplatny kontrolni bezpecnostni kod poplatnika (BKP)</eet:Chyba>
</eet:Odpoved></soap:Body></soap:Envelope>`;

	const parsed = xml.parseResponseXML(response);

	const error = t.throws(() => {
			xml.extractResponse(parsed);
		},
		{ instanceOf: ResponseServerError },
	);
	t.is(error.code, '5');
	t.is(error.message, 'Neplatny kontrolni bezpecnostni kod poplatnika (BKP)');

	t.log('Error:', error.message);

});

test('parseResponseXML ResponseParsingError', async t => {

	const response = `<soap:Envelope xmlns:eet="http://fs.mfcr.cz/eet/schema/v3"  xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Header><wsse:Security soap:mustUnderstand="1"><wsse:BinarySecurityToken wsu:Id="SecurityToken-d9ed076c-3142-4821-bcdb-46bcf8ef3233" EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3">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</wsse:BinarySecurityToken><Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
<SignedInfo>
  <CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
  <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256" />
  <Reference URI="#Body-6c1fe7bd-83d3-4349-98a1-46bcf8ef713f">
    <Transforms>
      <Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
    </Transforms>
    <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
    <DigestValue>rGvViOJNGsm4A/7SuqmU7FxcqA8esxsis0J/JtHxWlY=</DigestValue>
  </Reference>
</SignedInfo>
<SignatureValue>Q+kGGtFas2+8asw6t05S6aUJ6fsWYraLUwFFfowsVTi1X/OClM893shH0a8TmgqY5fRZeklIw4LppVLgaBZkFm4w9bgn3FbCNrFp2rYM3r8t7G6VfWhmWQGzIhtoIolnY46iXefn39AibhoEWgnXbRt6/IgpqXpwGS8Ahwc4GJHJvhHOG9AztVFzVgpR5FGkwZW6jGUJPQuX871PHGkEbVD6SAWnixPiNqfGvt72hfMutXvlOC2EZMDF/4EG0raf+V3LCxvLtHRYW3RqaglaK28rPYrmUOrzImhAkgKTA99GborB/qeTwZEQWo13b+kx07sTStusy1AuKj60y2L1+w==</SignatureValue><KeyInfo><wsse:SecurityTokenReference xmlns=""><wsse:Reference URI="#SecurityToken-d9ed076c-3142-4821-bcdb-46bcf8ef3233" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3" /></wsse:SecurityTokenReference></KeyInfo></Signature></wsse:Security></soap:Header><soap:Body wsu:Id="Body-6c1fe7bd-83d3-4349-98a1-46bcf8ef713f">
<eet:Odpoved>
	<eet:Hlavicka uuid_zpravy="ae0af488-5115-48c0-8d10-0861a2921981" bkp="6d8adb2d-a3a20e55-b78e8168-b240c580-38c71f7d" dat_prij="2020-03-05T19:56:02+01:00" />
	<eet:Potvrzeni fik="f741687f-61c8-4672-917a-46bcf8eff62d-fa" test="true" />
</eet:Odpoved></soap:Bod`;

	const error = t.throws(() => {
			xml.parseResponseXML(response);
		},
		{ instanceOf: errors.ResponseParsingError },
	);
	t.log('Error:', error.message);

});

test('sendEETRequest correct', async t => {

	const data = {
		prvniZaslani: true,
		overeni: false,
		dicPopl: 'CZ1212121218',
		idPokl: '/5546/RO24',
		poradCis: '0/6460/ZQ42',
		datTrzby: new Date(),
		celkTrzba: 3411300,
		idProvoz: 273,
	};

	const options = {
		playground: true,
		privateKey: PRIVATE_KEY,
		certificate: CERTIFICATE,
		measureResponseTime: true,
	};

	const { response: { fik, warnings, responseTime } } = await eet.sendEETRequest(data, options);

	t.not(fik, undefined);
	t.is(fik.length, 39);
	t.is(warnings, undefined);
	t.assert(responseTime > 0);

	t.log('FIK:', fik);
	t.log('responseTime:', Math.round(responseTime), 'ms');

});

test('sendEETRequest correct all fields', async t => {

	const data = {
		prvniZaslani: true,
		overeni: false,
		dicPopl: 'CZ1212121218',
		dicPoverujiciho: 'CZ1212121218',
		idProvoz: 273,
		idPokl: '/5546/RO24',
		poradCis: '0/6460/ZQ42',
		datTrzby: new Date(),
		celkTrzba: 3411300,
		zaklNepodlDph: 11041,
		dan1: 2000,
		zaklDan1: 10000,
		dan2: 1500,
		zaklDan2: 20000,
		dan3: 1000,
		zaklDan3: 30000,
		cestSluz: 9999,
		pouzitZboz1: 13579,
		pouzitZboz2: 21828,
		pouzitZboz3: 31415,
		urcenoCerpZuct: 42,
		cerpZuct: -1700,
	};

	const options = {
		playground: true,
		privateKey: PRIVATE_KEY,
		certificate: CERTIFICATE,
		userAgent: 'DummyUserAgent/1.0',
	};

	const { response: { fik, warnings } } = await eet.sendEETRequest(data, options);

	t.not(fik, undefined);
	t.is(fik.length, 39);
	t.is(warnings, undefined);

	t.log('FIK:', fik);

});

test('sendEETRequest wrong certificate', async t => {

	const data = {
		prvniZaslani: true,
		overeni: false,
		dicPopl: 'CZ1212121218',
		idPokl: '/5546/RO24',
		poradCis: '0/6460/ZQ42',
		datTrzby: new Date('2016-08-05T00:30:12+02:00'),
		celkTrzba: 3411300,
		idProvoz: 273,
	};

	const options = {
		playground: true,
		privateKey: FAKE_PRIVATE_KEY,
		certificate: CERTIFICATE,
		offline: false,
	};

	const error = await t.throwsAsync(eet.sendEETRequest(data, options));
	t.assert(error instanceof errors.ResponseServerError);
	t.is(error.code, '4');
	t.not(error.bkp, undefined);
	t.not(error.pkp, undefined);
	t.log('Error:', error);

});

test('getWarnings wrong datTrzby', async t => {

	const data = {
		prvniZaslani: true,
		overeni: false,
		dicPopl: 'CZ1212121218',
		idPokl: '/5546/RO24',
		poradCis: '0/6460/ZQ42',
		datTrzby: new Date('2000-01-01T00:30:12+02:00'),
		celkTrzba: 3411300,
		idProvoz: 273,
	};

	const options = {
		playground: true,
		privateKey: PRIVATE_KEY,
		certificate: CERTIFICATE,
	};

	const { response: { fik, warnings } } = await eet.sendEETRequest(data, options);

	const expected = [{
		code: '5',
		message: 'Datum a cas prijeti trzby je vyrazne v minulosti',
	}];

	t.not(fik, undefined);
	t.deepEqual(warnings, expected);
	t.log('Warning:', warnings[0].message);

});
