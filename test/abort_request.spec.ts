import axios, { AxiosInstance } from "axios";
import MockAdapter from "../src/index";

describe("requestAborted spec", function () {
  var instance: AxiosInstance;
  var mock;

  beforeEach(function () {
    instance = axios.create();
    mock = new MockAdapter(instance);
  });

  afterEach(function () {
    mock.restore();
  });

  it("mocks requestAborted response", function () {
    mock.onGet("/foo").abortRequest();

    return instance.get("/foo").then(
      function () {
        expect.fail("should not be called");
      },
      function (error) {
        expect(error.config).toBeTruthy();
        expect(error.code).to.equal("ECONNABORTED");
        expect(error.message).to.equal("Request aborted");
        expect(error.isAxiosError).to.be.true;
      }
    );
  });

  it("can abort a request only once", function () {
    mock.onGet("/foo").abortRequestOnce().onGet("/foo").reply(200);
    return instance
      .get("/foo")
      .then(
        function () {},
        function () {
          return instance.get("/foo");
        }
      )
      .then(function (response) {
        // @ts-ignore
        expect(response.status).to.equal(200);
      });
  });
});
