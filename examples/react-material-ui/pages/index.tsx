import React from 'react';
import { AppOuterView } from '@universal-form-examples/react-material-ui/components/Layout';
import { Fab } from '@material-ui/core';
import { Add as AddIcon } from '@material-ui/icons';

export default function IndexPage() {
  return <AppOuterView>
    <Fab color="primary" aria-label="open">
      <AddIcon />
    </Fab>
  </AppOuterView>
}

IndexPage.getInitialProps = () => {

};
