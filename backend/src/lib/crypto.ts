import { hash, verify } from "@node-rs/argon2";

const PASSWORD_OPTIONS = {
  memoryCost: 65536, 
  timeCost: 3,
  parallelism: 1,
} as const;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, PASSWORD_OPTIONS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return verify(passwordHash, password);
}