import { CapacitorConfig } from "@capacitor/cli";

const serverUrl = (process.env.CAPACITOR_SERVER_URL ?? "https://vps68020.publiccloud.com.br/seller").trim();

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
