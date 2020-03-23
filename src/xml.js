"use strict";

import parser from 'fast-xml-parser';
import { isDefined, validateDate, validateFik } from './utils';
import { hashSha256Base64, removePkcsHeader, signSha256Base64 } from './crypto';
import { ResponseParsingError, ResponseServerError, WrongServerResponse } from './errors';
import fetch from 'node-fetch';


/**
 * Serializes single empty XML with attributes in XML canonical form
 * Input must be sanitized against XSS
 * Canonicalization requirements:
 *   - tag must be properly closed
 *   - attributes must be sorted alphabetically
 * @see https://www.w3.org/TR/xml-exc-c14n/
 * @param tagName {string}
 * @param attributes {object}
 * @returns {string} XML tag in canonical form
 */
export const serializeXMLElement = (tagName, attributes) =>
	// found to be the fastest way to sort attributes
	// see benchmark: https://github.com/NFCtron/eet/commit/b628cb5a42d063f531ea1fe19f62ed3f54d7a4a0
	`<${tagName} ${
		Object.keys(attributes)
			.sort()
			.map(key => `${key}="${attributes[key]}"`)
			.join(' ')}></${tagName}>`
;

/**
 * Generates data for XML element KontrolniKody
 * @param pkp {string} PKP
 * @param bkp {string} BKP
 * @returns {string} KontrolniKody tag in canonical form
 */
export const serializeKontrolniKody = ({ pkp, bkp }) =>
	'<KontrolniKody>' +
	`<pkp cipher="RSA2048" digest="SHA256" encoding="base64">${pkp}</pkp>` +
	`<bkp digest="SHA1" encoding="base16">${bkp}</bkp>` +
	'</KontrolniKody>';
;

/**
 * Generates content for SOAP body from header and data objects
 * @param header {object}
 * @param data {object}
 * @param pkp {string}
 * @param bkp {string}
 * @returns {string} soap:Body tag in canonical form
 */
export const serializeSoapBody = ({ header, data, pkp, bkp }) =>
	'<soap:Body xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" id="Body">' +
	'<Trzba xmlns="http://fs.mfcr.cz/eet/schema/v3">' +
	serializeXMLElement('Hlavicka', header) +
	serializeXMLElement('Data', data) +
	serializeKontrolniKody({ pkp, bkp }) +
	'</Trzba>' +
	'</soap:Body>'
;

/**
 * Generate body signature for XML element SignedInfo
 * @param digest {string} a SHA256 hash of body encoded as base64 string
 * @returns {string} SignedInfo tag in canonical form
 */
export const serializeSignedInfo = digest =>
	'<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">' +
	'<CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></CanonicalizationMethod>' +
	'<SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"></SignatureMethod>' +
	'<Reference URI="#Body">' +
	'<Transforms>' +
	'<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform>' +
	'<Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></Transform>' +
	'</Transforms>' +
	'<DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></DigestMethod>' +
	`<DigestValue>${digest}</DigestValue>` +
	'</Reference>' +
	'</SignedInfo>'
;

/**
 * Generates full SOAP envelope with WSSecurity signature
 * @returns {string} soap:Envelope tag in canonical form
 */
export const serializeSoapEnvelope = ({ header, data, pkp, bkp, privateKey, certificate }) => {

	const body = serializeSoapBody({ header, data, bkp, pkp });
	const signedInfo = serializeSignedInfo(hashSha256Base64(body));
	const signature = signSha256Base64(privateKey, signedInfo);
	const publicKey = removePkcsHeader(certificate);

	return (
		`<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
			<soap:Header>
				<wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" soap:mustUnderstand="1">
					<wsse:BinarySecurityToken wsu:Id="cert" EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3">${publicKey}</wsse:BinarySecurityToken>
					<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
						${signedInfo}
						<SignatureValue>${signature}</SignatureValue>
						<KeyInfo>
							<wsse:SecurityTokenReference>
								<wsse:Reference URI="#cert" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3" />
							</wsse:SecurityTokenReference>
						</KeyInfo>
					</Signature>
				</wsse:Security>
			</soap:Header>
			${body}
		</soap:Envelope>`
	);

};

/**
 * Parse XML response into DOM
 * @param xml {string}
 * @returns {Promise}
 * @throws {ResponseParsingError}
 * @throws {ResponseServerError}
 */
export const parseResponseXML = (xml) => {

	const parsingError = parser.validate(xml);

	if (parsingError === true) {

		const options = {
			attributeNamePrefix: "_",
			ignoreAttributes: false,
			ignoreNameSpace: true,
			parseNodeValue: false,
			parseAttributeValue: false,
		};

		return parser.parse(xml, options);

	}
	else {
		throw new ResponseParsingError('Error parsing XML', parsingError);
	}

};

export const getChild = (obj, childName, debugPath) => {

	const element = obj[childName];
	if (!isDefined(element)) {
		throw new WrongServerResponse('XML element not defined: ' + debugPath);
	}

	return element;

};

export const getAttribute = (obj, attrName, debugPath) => {

	const attribute = obj['_' + attrName];
	if (!isDefined(attribute)) {
		throw new WrongServerResponse('XML attribute not defined: ' + debugPath);
	}

	return attribute;

};

/**
 * Transform XML DOM into data object
 * @param parsed {object}
 * @returns {object}
 * @throws {ResponseParsingError}
 * @throws {ResponseServerError}
 */
export const extractResponse = parsed => {

	if (!isDefined(parsed)) {
		throw new WrongServerResponse('XML response empty');
	}

	const envelope = getChild(parsed, 'Envelope', 'Envelope');
	const body = getChild(envelope, 'Body', 'Envelope>Body');
	const odpoved = getChild(body, 'Odpoved', 'Envelope>Body>Odpoved');

	// try to parse error message from XML, not failing if not present
	const chyba = odpoved['Chyba'];
	if (isDefined(chyba)) {
		throw new ResponseServerError(chyba['#text'], chyba['_kod']);
	}

	const hlavicka = getChild(odpoved, 'Hlavicka', 'Envelope>Body>Odpoved>Hlavicka');

	const uuidZpravy = getAttribute(hlavicka, 'uuid_zpravy', 'Envelope>Body>Odpoved>Hlavicka:uuid_zpravy');
	const bkp = getAttribute(hlavicka, 'bkp', 'Envelope>Body>Odpoved>Hlavicka:bkp');
	const datPrij = getAttribute(hlavicka, 'dat_prij', 'Envelope>Body>Odpoved>Hlavicka:dat_prij');

	const potvrzeni = getChild(odpoved, 'Potvrzeni', 'Envelope>Body>Odpoved>Potvrzeni');

	// TODO: test might be omitted if equal to false
	const test = getAttribute(potvrzeni, 'test', 'Envelope>Body>Odpoved>Potvrzeni:test');

	const fik = getAttribute(potvrzeni, 'fik', 'Envelope>Body>Odpoved>Potvrzeni:fik');

	const data = {
		uuidZpravy,
		bkp,
		datPrij,
		test,
		fik,
	};

	// warning(s) can be part of message
	const varovani = odpoved['Varovani'];
	if (isDefined(varovani)) {

		if (Array.isArray(varovani)) {

			// multiple warnings in an array
			data.warnings = varovani
				.map((warning) => {

					const message = getChild(warning, '#text', 'Envelope>Body>Odpoved>Varovani');
					const code = getAttribute(warning, 'kod_varov', 'Envelope>Body>Odpoved>Varovani:kod_varov');

					return {
						message,
						code,
					};

				});
		}
		else {

			const message = getChild(varovani, '#text', 'Envelope>Body>Odpoved>Varovani');
			const code = getAttribute(varovani, 'kod_varov', 'Envelope>Body>Odpoved>Varovani:kod_varov');

			// make array from single warning
			data.warnings = [{
				message,
				code,
			}];
		}
	}

	return data;

};

/**
 * Validate incoming response against sent request
 * UUID, BKP, test must be same in both response and request
 * datPrij and FIK must be valid
 * @throws WrongServerResponse
 */
export const validateResponse = ({ reqUuid, reqBkp, reqPlayground }, { uuidZpravy, bkp, datPrij, test, fik }) => {

	if (reqUuid !== uuidZpravy) {
		throw new WrongServerResponse(`UUID in response: ${uuidZpravy} is not same as sent: ${reqUuid}`);
	}

	if (reqBkp !== bkp) {
		throw new WrongServerResponse(`BKP in response: ${bkp} is not same as sent: ${reqBkp}`);
	}

	if (!validateDate(datPrij)) {
		throw new WrongServerResponse(`dat_prij in response is invalid: ${datPrij}`);
	}

	if (reqPlayground !== test) {
		throw new WrongServerResponse(`test in response: ${test} is not same as sent: ${reqPlayground}`);
	}

	if (!validateFik(fik)) {
		throw new WrongServerResponse(`FIK in response is invalid: ${fik}`);
	}

};

/**
 * Fetch URL and return XML response
 * @param url {string}
 * @param options {object}
 * @returns {Promise<string>}
 */
export const fetchXml = async (url, options) => {

	const response = await fetch(url, options);

	// check content-type header for text/xml of application/xml
	const contentType = response.headers.get('content-type');

	/* istanbul ignore next */
	if (!(contentType.includes('text/xml') || contentType.includes('application/xml'))) {
		throw new WrongServerResponse('Unknown content-type: ' + contentType);
	}

	return await response.text();

};
