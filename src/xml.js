"use strict";

import parser from 'fast-xml-parser';
import { isDefined } from './utils';
import { generateBKP, generatePKP, hashSha256Base64, removePkcsHeader, signSha256Base64 } from './crypto';
import { ResponseParsingError, ResponseServerError } from './errors';


/**
 * Generates data for XML element Data
 * @param data {object}
 * @returns {string} canonical
 */
export const serializeData = (data) => {

	return `<Data ${
		Object.entries(data)
			.map(([key, value]) => `${key}="${value}"`)
			.sort()
			.join(' ')}></Data>`;

};

/**
 * Generates data for XML element KontrolniKody
 * @param privateKey {Buffer}
 * @param data {object}
 * @returns {string} canonical
 */
export const serializeKontrolniKody = (privateKey, data) => {

	const pkp = generatePKP(privateKey, data);
	const bkp = generateBKP(pkp);

	return `<KontrolniKody><pkp cipher="RSA2048" digest="SHA256" encoding="base64">${pkp}</pkp><bkp digest="SHA1" encoding="base16">${bkp}</bkp></KontrolniKody>`;
};

/**
 * Generates content for SOAP body from header and data objects
 * @param privateKey {string}
 * @param header {object}
 * @param data {object}
 * @returns {string} canonical
 */
export const serializeSoapBody = (privateKey, header, data) => {

	return `<soap:Body xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" id="Body">
<Trzba xmlns="http://fs.mfcr.cz/eet/schema/v3">
<Hlavicka dat_odesl="${header.dat_odesl}" prvni_zaslani="${header.prvni_zaslani}" uuid_zpravy="${header.uuid_zpravy}"></Hlavicka>
${serializeData(data)}
${serializeKontrolniKody(privateKey, data)}
</Trzba>
</soap:Body>`;

};

/**
 * Generate body signature for XML element SignedInfo
 * @param body
 * @returns {string} canonical
 */
export const serializeSignedInfo = (body) => {

	const digest = hashSha256Base64(body);

	return `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></CanonicalizationMethod><SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"></SignatureMethod><Reference URI="#Body"><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform><Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></Transform></Transforms><DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></DigestMethod><DigestValue>${digest}</DigestValue></Reference></SignedInfo>`

};

/**
 * Generates full SOAP envelope with WSSecurity signature
 * @param privateKey {string}
 * @param certificate {string}
 * @param header {object}
 * @param data {object}
 * @returns {string}
 */
export const serializeSoapEnvelope = (privateKey, certificate, header, data) => {

	const body = serializeSoapBody(privateKey, header, data);
	const signedInfo = serializeSignedInfo(body);
	const signature = signSha256Base64(privateKey, signedInfo);
	const publicKey = removePkcsHeader(certificate);

	return `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
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
				</soap:Envelope>`;

};

/**
 * Parse XML response
 * @param xml {string}
 * @returns {Promise}
 * @throws {ResponseParsingError}
 * @throws {ResponseServerError}
 */
export const parseResponseXML = (xml) => {

	return new Promise((resolve, reject) => {

		if (parser.validate(xml) !== true) {
			return reject(new ResponseParsingError('Error parsing XML', parser.validate(xml)));
		}

		// TODO: Validate digital signature here

		const options = {
			attributeNamePrefix: "_",
			ignoreAttributes: false,
			ignoreNameSpace: true,
		};
		const parsed = parser.parse(xml, options);

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

			return resolve(data);

		} catch (e) {

			// Try to parse error message from XML
			return reject(new ResponseServerError(
				parsed['Envelope']['Body']['Odpoved']['Chyba']['#text'],
				parsed['Envelope']['Body']['Odpoved']['Chyba']['_kod'],
			));

		}

	});

};

