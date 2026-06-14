import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.rutero.app",
  appName: "RUTERO",
  webDir: "public",
  server: {
    // URL de la instancia en tu VPS (actualizada)
    url: "https://vps68020.publiccloud.com.br/seller",
    cleartext: false
  }
};

export default config;
