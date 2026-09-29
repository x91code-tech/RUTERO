import Constants from "expo-constants";

type Extra = {
  apiBaseUrl?: string;
};

const extra = Constants.expoConfig?.extra as Extra | undefined;

export const API_BASE_URL = (extra?.apiBaseUrl ?? "https://vps71519.publiccloud.com.br").replace(/\/$/, "");
