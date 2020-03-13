"use strict";

import { isDefined } from './utils';
import { generatePKP, generateBKP, hashSha256Base64, signSha256Base64, getPublicKey } from './crypto';


/**
 * Generates data for XML element Data
 */
export const serializeData = (data) =>
	`<Data celk_trzba="${data.celkTrzba}" dan1="${data.dan1}" dat_trzby="${data.datTrzby}" dic_popl="${data.dicPopl}" id_pokl="${data.idPokl}" id_provoz="${data.idProvoz}" porad_cis="${data.poradCis}" rezim="${data.rezim}" zakl_dan1="${data.zaklDan1}"></Data>`;

/**
 * Generates data for XML element KontrolniKody
 */
export const serializeKontrolniKody = (privateKey, data) => {

	const pkp = generatePKP(privateKey, data);
	const bkp = generateBKP(pkp);

	return `<KontrolniKody><pkp cipher="RSA2048" digest="SHA256" encoding="base64">${pkp}</pkp><bkp digest="SHA1" encoding="base16">${bkp}</bkp></KontrolniKody>`;
};

/**
 * Generates content for SOAP body
 */
export const serializeSoapBody = (privateKey, header, data) =>
	`<soap:Body xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" id="Body">
<Trzba xmlns="http://fs.mfcr.cz/eet/schema/v3">
<Hlavicka dat_odesl="${header.datOdesl}" prvni_zaslani="${header.prvniZaslani}" uuid_zpravy="${header.uuidZpravy}"></Hlavicka>
${serializeData(data)}
${serializeKontrolniKody(privateKey, data)}
</Trzba>
</soap:Body>`;

/**
 * Generate body signature for XML element SignedInfo
 * @param body
 * @returns {string}
 */
export const serializeSignedInfo = (body) => {
	const digest = hashSha256Base64(body);

	return `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></CanonicalizationMethod><SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"></SignatureMethod><Reference URI="#Body"><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform><Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></Transform></Transforms><DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></DigestMethod><DigestValue>${digest}</DigestValue></Reference></SignedInfo>`
};

/**
 * Generates full SOAP envelope
 * @returns {string}
 */
export const serializeSoapEnvelope = (privateKey, certificate, header, data) => {
	const body = serializeSoapBody(privateKey, header, data);
	const signedInfo = serializeSignedInfo(body);
	const signature = signSha256Base64(privateKey, signedInfo);
	const publicKey = getPublicKey(certificate);
	return `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
					<soap:Header>
						<wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" soap:mustUnderstand="1">
							<wsse:BinarySecurityToken wsu:Id="cert" EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3">${publicKey}</wsse:BinarySecurityToken>
							<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
								${signedInfo}
								<SignatureValue>${signature}</SignatureValue>
								<KeyInfo>
									<wsse:SecurityTokenReference>
										<wsse:Reference URI="#cert" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3"></wsse:Reference>
									</wsse:SecurityTokenReference>
								</KeyInfo>
							</Signature>
						</wsse:Security>
					</soap:Header>
${body}
				</soap:Envelope>`;
};

const getWarnings = warnings => {

	if (!warnings || warnings.length <= 0) {
		return [];
	}

	return warnings.map(warning => warning.$value);

};

/**
 * Processes success response from server
 */
export const getResponseItems = (response, duration) => {

	const header = response.Hlavicka.attributes;

	const body = response.Potvrzeni.attributes;

	const data = {
		uuid: header.uuid_zpravy,
		bkp: header.bkp,
		date: new Date(header.dat_prij),
		test: body.test === 'true',
		fik: body.fik,
		warnings: getWarnings(response.Varovani),
	};

	if (isDefined(duration)) {
		data.duration = duration;
	}

	return data;

};
