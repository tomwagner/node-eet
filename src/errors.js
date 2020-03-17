"use strict";


export class ResponseServerError extends Error {

	constructor(message, code) {

		super(message);
		this.code = code;
		Error.captureStackTrace(this, this.constructor);

	}

}

export class ResponseParsingError extends Error {

	constructor(message, info) {

		super(message);
		this.info = info;
		Error.captureStackTrace(this, this.constructor);

	}

}

export class RequestParsingError extends Error {

	constructor(message, info) {

		super(message);
		this.info = info;
		Error.captureStackTrace(this, this.constructor);

	}

}
