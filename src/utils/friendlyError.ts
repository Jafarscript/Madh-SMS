/* eslint-disable @typescript-eslint/no-explicit-any */

export interface FriendlyErrorOptions {
  fallback?: string;
  unauthorizedMessage?: string;
}

const TECHNICAL_PATTERN =
  /vercel|render|mongodb|mongoose|jwt_secret|vite_api_url|serverless|enotfound|etimedout|econnrefused|network error/i;

export const getFriendlyErrorMessage = (
  err: any,
  options: FriendlyErrorOptions | string = {}
): string => {
  const opts: FriendlyErrorOptions =
    typeof options === "string" ? { fallback: options } : options;

  const fallback =
    opts.fallback || "Something went wrong. Please try again in a moment.";

  const status: number | undefined = err?.response?.status;
  const respData = err?.response?.data;
  const serverMessage =
    typeof respData?.message === "string" ? respData.message.trim() : "";

  if (status === 401 && opts.unauthorizedMessage) {
    return opts.unauthorizedMessage;
  }

  if (err?.code === "ECONNABORTED") {
    return "This is taking longer than usual. Please wait a few seconds and try again.";
  }

  if (err?.message === "Network Error" || !err?.response) {
    return "Unable to connect right now. Please check your internet connection and try again in a moment.";
  }

  if (status === 502 || status === 503 || status === 504) {
    return "The school portal is temporarily busy or starting up. Please wait a moment and try again.";
  }

  if (status && status >= 500) {
    return "We couldn't complete your request right now. Please try again in a moment.";
  }

  if (status === 404 && !serverMessage) {
    return fallback;
  }

  if (serverMessage && !TECHNICAL_PATTERN.test(serverMessage)) {
    return serverMessage;
  }

  return fallback;
};
