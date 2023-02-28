export default class RequestError extends Error {
  public code: number;
  public codeText: string;
  public response;

  constructor(code: number, codeText: string, response) {
    codeText = codeText === 'Error' ? response.name : codeText;
    const title = code && codeText ? `${code} - ${codeText}` : code || codeText;
    const responseMessage = response?.message ? response.message : response;
    const message =
      title && responseMessage
        ? `${title}\n${responseMessage}`
        : title || responseMessage;
    super(message.toString());
    this.code = code;
    this.codeText = codeText;
    this.response = response;
    console.error(this);
  }
}
