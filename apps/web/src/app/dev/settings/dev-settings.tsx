"use client";

import { Settings } from "@/components/settings";

export function DevSettings({ fail }: { fail: boolean }) {
  return (
    <Settings
      account={{ name: "[Tên tài khoản Google]", email: "[email@gmail.com]" }}
      api={{
        deleteAccount: () => (fail ? Promise.reject(new Error("dev")) : new Promise(() => {})),
        signOut: () => Promise.resolve(),
      }}
    />
  );
}
