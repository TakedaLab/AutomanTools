import React from 'react';
import Button from '@material-ui/core/Button';
import CardHeader from '@material-ui/core/CardHeader';
import { amber, green } from '@material-ui/core/colors';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import Close from '@material-ui/icons/Close';
import Send from '@material-ui/icons/Send';

export default class AnnotationArchiveDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formOpen: false,
      isJobSent: false,
      isSendFailed: false,
      message: '',
    };
  }

  show = () => {
    this.setState({ formOpen: true });
  };

  hide = () => {
    this.setState({ formOpen: false });
  };

  sendJob = () => {
    const datasetUrl =
      `/projects/${this.props.project_id}` +
      `/datasets/${this.props.dataset_id}/`;
    RequestClient.get(
      datasetUrl,
      null,
      datasetInfo => {
        const url = `/projects/${this.props.project_id}/jobs/`,
          data = {
            job_type: 'ARCHIVER',
            job_config: {
              original_id: datasetInfo.original_id,
              dataset_id: this.props.dataset_id,
              annotation_id: this.props.annotation_id
            }
          };
        RequestClient.post(
          url,
          data,
          res => {
            this.setState({
              isJobSent: true,
              message: 'Semi-labeling job has successfully been sent.'
            });
          },
          mes => {
            this.setState({
              isSendFailed: true,
              message: mes.message
            });
          }
        );
      },
      mes => {
        this.setState({
          message: mes.message
        });
      }
    );
  };
  render() {
    const closeButton = (
      <Button onClick={this.hide}>
        <Close />
      </Button>
    );
    const successMessage = (
      <SnackbarContent
        message={this.state.message}
        style={{
          backgroundColor: green[600],
          marginTop: '15px'
        }}
      />
    );
    const errorMessage = (
      <SnackbarContent
        message={this.state.message}
        style={{
          backgroundColor: amber[700],
          marginTop: '15px'
        }}
      />
    );

    return (
      <span className="col-xs-1">
        <a
          className="button glyphicon glyphicon-folder-close"
          onClick={this.show}
          title="Archive"
        />

        <div>
          <Dialog
            open={this.state.formOpen}
            aria-labelledby="form-dialog-title"
          >
            <CardHeader action={closeButton} title="Archive" />
            <DialogContent>
              <div style={{ marginTop: '5px' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={this.sendJob}
                >
                  <Send />
                  &nbsp;Submit
                </Button>
              </div>
              {this.state.isJobSent === true ? successMessage : null}
              {this.state.isSendFailed === true ? errorMessage : null}
            </DialogContent>
          </Dialog>
        </div>
      </span>
    );
  }
}
