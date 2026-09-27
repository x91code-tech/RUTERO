import { CapacitorConfig } from "@capacitor/cli";

const serverUrl = (process.env.CAPACITOR_SERVER_URL ?? "https://rutero.fr-host.fr/login?force=email").trim();

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
