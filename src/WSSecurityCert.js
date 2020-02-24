"use strict";

import { SignedXml } from 'xml-crypto';


const SIGNATURE_ALGORITHM = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';

const TRANSFORM_ALGORITHMS = [
	'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
	'http://www.w3.org/2001/10/xml-exc-c14n#',
];

const DIGEST_ALGORITHM = 'http://www.w3.org/2001/04/xmlenc#sha256';

const insertStr = (src, dst, pos) => [dst.slice(0, pos), src, dst.slice(pos)].join('');

const removeCertHeaderAndFooter = publicP12PEM =>
	publicP12PEM
		.toString()
		.replace('-----BEGIN CERTIFICATE-----', '')
		.replace('-----END CERTIFICATE-----', '')
		.replace(/(\r\n|\n|\r)/gm, '');

const getTokenXml = id => (
	// in the new version of xml-crypto or soap xmlns:wsse must be defined here explictely otherwise it is set to ""
	`<wsse:SecurityTokenReference xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"><wsse:Reference URI="#${id}" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3"/></wsse:SecurityTokenReference>`
);

const getSecurityXml = (id, binaryToken) => (`<wsse:Security
	xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
	xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"
	soap:mustUnderstand="1"
>
	<wsse:BinarySecurityToken
		EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary"
		ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3"
		wsu:Id="${id}">
		${binaryToken}
	</wsse:BinarySecurityToken>
</wsse:Security>`);


export default class WSSecurityCert {

	constructor(privateKey, certificate) {

		this.x509Id = null;

		this.publicP12PEM = removeCertHeaderAndFooter(certificate);

		this.signer = new SignedXml();
		this.signer.signingKey = privateKey;
		this.signer.signatureAlgorithm = SIGNATURE_ALGORITHM;
		this.signer.addReference("//*[local-name(.)='Body']", TRANSFORM_ALGORITHMS, DIGEST_ALGORITHM);

		this.signer.keyInfoProvider = {};
		this.signer.keyInfoProvider.getKeyInfo = () => getTokenXml(this.x509Id);

	}

	updateX509Id(xml) {

		const uuidMatch = xml.match(/uuid_zpravy="(.{36})"/);

		if (!uuidMatch) {
			throw new Error('uuid_zpravy not found in request body. Security token cannot be computed.')
		}

		const uid = uuidMatch[1];

		this.x509Id = 'x509-' + uid.replace(/-/gm, '');

	}

	postProcess(xml) {

		this.updateX509Id(xml);

		const secHeader = getSecurityXml(this.x509Id, this.publicP12PEM);

		const xmlWithSec = insertStr(secHeader, xml, xml.indexOf('</soap:Header>'));

		this.signer.computeSignature(xmlWithSec);

		return insertStr(this.signer.getSignatureXml(), xmlWithSec, xmlWithSec.indexOf('</wsse:Security>'));

	}

}
