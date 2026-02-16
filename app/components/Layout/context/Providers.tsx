"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { ContextProvider } from "./ContextProvider";

interface Props {
  children: React.ReactNode;
}

export const Providers = ({ children }: Props) => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return <ContextProvider>{children}</ContextProvider>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ContextProvider>{children}</ContextProvider>
    </GoogleOAuthProvider>
  );
};
