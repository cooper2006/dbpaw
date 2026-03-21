import { describe, expect, test } from "bun:test";
import type { ConnectionForm } from "@/services/api";
import {
  normalizeConnectionFormInput,
  parseHostEmbeddedPort,
} from "./rules";
import { validateConnectionFormInput } from "./validate";

const baseForm = (): ConnectionForm => ({
  driver: "mysql",
  host: "127.0.0.1",
  port: 3306,
  username: "root",
  password: "pass",
  sshEnabled: false,
});

describe("normalizeConnectionFormInput", () => {
  test("trims text fields and parses mysql host embedded port", () => {
    const normalized = normalizeConnectionFormInput({
      ...baseForm(),
      host: " 10.0.0.8:3307 ",
      port: undefined,
      username: " root ",
    });
    expect(normalized.host).toBe("10.0.0.8");
    expect(normalized.port).toBe(3307);
    expect(normalized.username).toBe("root");
  });
});

describe("parseHostEmbeddedPort", () => {
  test("keeps fallback port when provided", () => {
    const parsed = parseHostEmbeddedPort("localhost:3310", 3306);
    expect(parsed.host).toBe("localhost");
    expect(parsed.port).toBe(3306);
  });
});

describe("validateConnectionFormInput", () => {
  test("validates required ssh fields and auth method", () => {
    const issues = validateConnectionFormInput(
      {
        ...baseForm(),
        sshEnabled: true,
        sshHost: "",
        sshPort: 11022,
        sshUsername: "",
        sshPassword: "",
        sshKeyPath: "",
      },
      "create",
    );
    expect(issues.map((v) => v.key)).toEqual([
      "connection.dialog.inputValidation.sshHostRequired",
      "connection.dialog.inputValidation.sshUsernameRequired",
      "connection.dialog.inputValidation.sshAuthRequired",
    ]);
  });

  test("rejects out-of-range port", () => {
    const issues = validateConnectionFormInput(
      {
        ...baseForm(),
        port: 70000,
      },
      "create",
    );
    expect(issues.some((v) => v.key === "connection.dialog.inputValidation.portRange")).toBe(
      true,
    );
  });
});
