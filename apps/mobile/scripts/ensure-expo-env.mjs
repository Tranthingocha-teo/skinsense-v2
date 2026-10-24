// Expo writes expo-env.d.ts on `expo start` and gitignores it, but tsc needs it on a fresh clone.
import { existsSync, writeFileSync } from "node:fs";

const file = new URL("../expo-env.d.ts", import.meta.url);
if (!existsSync(file)) writeFileSync(file, '/// <reference types="expo/types" />\n');
