export type JwtPayload = {
  sub: string;
};

export type TokenSigner = {
  sign(payload: JwtPayload): string;
};

export type TokenVerifier = {
  verify(token: string): JwtPayload;
};