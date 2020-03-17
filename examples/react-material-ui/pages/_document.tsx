import ServerStyleSheets from '@material-ui/styles/ServerStyleSheets';
import NextDocument, { Head, Html, Main, NextScript } from 'next/document';
import React from 'react';
import { ServerStyleSheet } from 'styled-components';

export default class Document extends NextDocument {
  // @ts-ignore
  static async getInitialProps(ctx) {
    const sheetStyled = new ServerStyleSheet();
    const sheetMUI = new ServerStyleSheets();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          // @ts-ignore
          enhanceApp: App => props =>
            sheetStyled.collectStyles(sheetMUI.collect(<App {...props} />))
        });

      const initialProps = await NextDocument.getInitialProps(ctx);
      return {
        ...initialProps,
        styles: [
          <React.Fragment key="styles">
            {initialProps.styles}
            {sheetMUI.getStyleElement()}
            {sheetStyled.getStyleElement()}
          </React.Fragment>
        ]
      };
    } finally {
      sheetStyled.seal();
    }
  }

  render() {
    return (
      <Html>
        <Head>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
