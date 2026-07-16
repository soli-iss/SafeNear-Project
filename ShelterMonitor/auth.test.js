import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { makeJWT, verifyJWT, extractBearerToken } from './controllers/auth.js';
import { BadRequestError } from './utils/errors.js';

describe("JWT signing", () => {
  let jwt1
    let jwt2

  beforeAll(async () => {
      jwt1 = makeJWT("user1", 3600, "secretKey1");
      jwt2 = makeJWT("user2", 3600, "secretKey2");
      
  });
    
    it("should validate a valid JWT", () => {
        const result = verifyJWT(jwt1, "secretKey1");
        console.log(result);
    expect(result).toBe("user1");
  });
    
    it("should throw an error for an invalid JWT", () => {
    expect(() => verifyJWT(jwt1, "wrongSecretKey")).toThrow();
  });

});


describe("extractBearerToken", () => {
  it("should extract the token from a valid header", () => {
    const token = "mySecretToken";
    const header = `Bearer ${token}`;
    expect(extractBearerToken(header)).toBe(token);
  });

  it("should extract the token even if there are extra parts", () => {
    const token = "mySecretToken";
    const header = `Bearer ${token} extra-data`;
    expect(extractBearerToken(header)).toBe(token);
  });

  it("should throw a BadRequestError if the header does not contain at least two parts", () => {
    const header = "Bearer";
    expect(() => extractBearerToken(header)).toThrow(BadRequestError);
  });

  it('should throw a BadRequestError if the header does not start with "Bearer"', () => {
    const header = "Basic mySecretToken";
    expect(() => extractBearerToken(header)).toThrow(BadRequestError);
  });

  it("should throw a BadRequestError if the header is an empty string", () => {
    const header = "";
    expect(() => extractBearerToken(header)).toThrow(BadRequestError);
  });
});