import { CapacitorConfig } from "@capacitor/cli";

const serverUrl = (process.env.CAPACITOR_SERVER_URL ?? "https://vps71519.publiccloud.com.br").trim();

const config: CapacitorConfig = {
  appId: "com.rutero.app",
  appName: "RUTERO",
  webDir: "public",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://")
  }
};

export default config;
