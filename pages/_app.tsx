import React, {
  ReactElement,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import 'focus-visible';
import Modal from 'react-modal';
import ReactGA from 'react-ga';
import { DefaultSeo } from 'next-seo';
import { QueryCache, ReactQueryCacheProvider } from 'react-query';
import Seo from '../next-seo';
import GlobalStyle from '../components/GlobalStyle';
import AuthContext from '../components/AuthContext';
import { logout as dispatchLogout } from '../lib/user';
import { Router } from 'next/router';
import { useCookieBanner } from '../lib/useCookieBanner';
import useLoggedUser from '../lib/useLoggedUser';

const queryCache = new QueryCache();

const LoginModal = dynamic(() => import('../components/modals/LoginModal'));
const CookieBanner = dynamic(() => import('../components/CookieBanner'));

Modal.setAppElement('#__next');
Modal.defaultStyles = {};

interface CompnentGetLayout {
  getLayout?: (page: ReactNode, props: Record<string, unknown>) => ReactNode;
}

const trackPageView = (url) => {
  const page = `/web${url}`;
  ReactGA.set({ page });
  ReactGA.pageview(page);
};

Router.events.on('routeChangeComplete', trackPageView);

export default function App({ Component, pageProps }: AppProps): ReactElement {
  const [initializedGA, setInitializedGA] = useState(false);
  const [user, setUser, trackingId, loadingUser] = useLoggedUser();
  const [loginIsOpen, setLoginIsOpen] = useState(false);
  const [showCookie, acceptCookies, updateCookieBanner] = useCookieBanner();

  const closeLogin = () => setLoginIsOpen(false);

  const logout = async (): Promise<void> => {
    await dispatchLogout();
    location.reload();
  };

  const authContext = useMemo(
    () => ({
      user,
      shouldShowLogin: loginIsOpen,
      showLogin: () => setLoginIsOpen(true),
      updateUser: setUser,
      logout,
      loadingUser,
    }),
    [user, loginIsOpen, loadingUser],
  );

  useEffect(() => {
    if (trackingId && !initializedGA) {
      ReactGA.initialize(process.env.NEXT_PUBLIC_GA, {
        gaOptions: {
          clientId: pageProps.trackingId,
        },
      });
      trackPageView(`${window.location.pathname}${window.location.search}`);
      setInitializedGA(true);
    }
  }, [trackingId]);

  useEffect(() => {
    if (
      user &&
      !user.infoConfirmed &&
      window.location.pathname.indexOf('/register') !== 0
    ) {
      window.location.replace(
        `/register?redirect_uri=${encodeURI(window.location.pathname)}`,
      );
    }
    updateCookieBanner(user);
  }, [user, loadingUser]);

  const getLayout =
    (Component as CompnentGetLayout).getLayout || ((page) => page);

  return (
    <ReactQueryCacheProvider queryCache={queryCache}>
      <AuthContext.Provider value={authContext}>
        <Head>
          <meta
            name="viewport"
            content="initial-scale=1.0, width=device-width"
          />
          <meta name="theme-color" content="#151618" />
          <meta name="msapplication-navbutton-color" content="#151618" />
          <meta
            name="apple-mobile-web-app-status-bar-style"
            content="#151618"
          />
          <link rel="preconnect" href="https://storage.googleapis.com" />
        </Head>
        <DefaultSeo {...Seo} />
        <GlobalStyle />
        {getLayout(<Component {...pageProps} />, pageProps)}
        <LoginModal
          isOpen={loginIsOpen}
          onRequestClose={closeLogin}
          contentLabel="Login Modal"
        />
        {showCookie && <CookieBanner onAccepted={acceptCookies} />}
      </AuthContext.Provider>
    </ReactQueryCacheProvider>
  );
}
