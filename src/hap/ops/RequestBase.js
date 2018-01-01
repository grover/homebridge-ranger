"use strict";

class RequestBase {

  constructor(request) {
    this._request = request;
  }

  hasMoreRequests() {
    return this._request !== undefined;
  }

  getRequest() {
    const r = this._request;
    this._request = undefined;
    return r;
  }

  handleResponse(response) {
    this._response = response;
  }

  getResult() {
    return this._response;
  }
};

module.exports = RequestBase;
