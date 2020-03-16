"use strict";


export class ResponseServerError extends Error {

	constructor(message, code) {

		super();
		Error.captureStackTrace(this, this.constructor);
		this.name = 'ResponseServerError';

		this.code = code;
		this.message = message;

	}

}

export class ResponseParsingError extends Error {

	constructor(message, info) {

		super();
		Error.captureStackTrace(this, this.constructor);
		this.name = 'ResponseParsingError';

		this.info = info;

	}

}
