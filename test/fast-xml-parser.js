"use strict";

import test from 'ava';
import parser from 'fast-xml-parser';


test('validate valid XML', async t => {

	const xml = '<Data><Error>Text</Error></Data>';

	const validationResult = parser.validate(xml);

	t.is(validationResult, true);

});

test('validate InvalidXml', async t => {

	const xml = '<Data><Error>Text</Error><Data>';

	const validationResult = parser.validate(xml);

	const expectedValidationResult = {
		err: {
			code: 'InvalidXml',
			msg: `Invalid '[    "Data",    "Data"]' found.`,
			line: 1,
		},
	};

	t.deepEqual(validationResult, expectedValidationResult);

});

test('parse invalid', async t => {

	const xml = `<soap:Envelope xmlns:eet="http://fs.mfcr.cz/eet/schema/v3"  xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Header><wsse:Security soap:mustUnderstand="1"><wsse:BinarySecurityToken wsu:Id="SecurityToken-d9ed076c-3142-4821-bcdb-46bcf8ef3233" EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3">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</wsse:BinarySecurityToken><Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
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

	const result = parser.parse(xml, {
		attributeNamePrefix: "_",
		ignoreAttributes: false,
		ignoreNameSpace: true,
		parseNodeValue: false,
		parseAttributeValue: false,
	});

	console.log(result);

	t.deepEqual(result, true);

});
