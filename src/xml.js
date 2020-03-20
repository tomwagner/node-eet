"use strict";

import parser from 'fast-xml-parser';
import { isDefined } from './utils';
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
	`<${tagName} ${
		Object.entries(attributes)
			.map(([key, value]) => `${key}="${value}"`)
			.sort()
			.join(' ')}></${tagName}>`
;

/**
 * Generates data for XML element KontrolniKody
 * @param pkp {string} PKP
 * @param bkp {string} BKP
 * @returns {string} canonical TODO: expand the desc of the return value
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
 * @returns {string} canonical TODO: expand the desc of the return value
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
 * @returns {string} canonical
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
 * @returns {string}
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
		};

		return parser.parse(xml, options);

	}
	else {

		throw new ResponseParsingError('Error parsing XML', parsingError);

	}

};

/**
 * Transform XML DOM into data object
 * @param parsed {object}
 * @returns {object}
 * @throws {ResponseParsingError}
 * @throws {ResponseServerError}
 */
export const extractResponse = parsed => {

	try {

		const header = parsed['Envelope']['Body']['Odpoved']['Hlavicka'];
		const body = parsed['Envelope']['Body']['Odpoved']['Potvrzeni'];

		const data = {
			uuid: header['_uuid_zpravy'],
			bkp: header['_bkp'],
			date: new Date(header['_dat_prij']),
			test: body['_test'] === 'true',
			fik: body['_fik'],
		};

		// Warning(s) can be part of message
		const warnings = parsed['Envelope']['Body']['Odpoved']['Varovani'];
		if (isDefined(warnings)) {

			if (Array.isArray(warnings)) {

				// Multiple warnings in an array
				data.warnings = warnings
					.map((warning) => {
						return {
							message: warning['#text'],
							code: warning['_kod_varov'],
						}
					});
			}
			else {

				// Make array from single warning
				data.warnings = [{
					message: warnings['#text'],
					code: warnings['_kod_varov'],
				}];
			}
		}

		return data;

	} catch (e) {

		// Try to parse error message from XML
		throw new ResponseServerError(
			parsed['Envelope']['Body']['Odpoved']['Chyba']['#text'],
			parsed['Envelope']['Body']['Odpoved']['Chyba']['_kod']);

	}

};

// TODO: remove Promise and finish (check bkp and option.playground too)
export const validateSOAPSignature = xml => {
	// TODO: validate digital signature here
	return xml;
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
	if (!(contentType.includes('text/xml') || contentType.includes('application/xml'))) {
		throw new WrongServerResponse('Unknown content-type: ' + contentType);
	}

	return await response.text();

};
