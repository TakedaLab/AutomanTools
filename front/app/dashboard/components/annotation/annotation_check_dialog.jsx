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

export default class AnnotationCheckDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formOpen: false,
      isJobSent: false,
      uuid: '',
      message: '',
      retry: 0
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
            job_type: 'ANNOTATION_CHECKER',
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
            let parsed = JSON.parse(res);
            this.setState({
              isJobSent: true,
              uuid: parsed.uuid,
              message: 'Checking...'
            });
            this.getResult();
          },
          mes => {
            this.setState({
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
  getResult = () => {
    const url =
      `/projects/${this.props.project_id}` +
      `/annotations/${this.props.annotation_id}/check_result/`;
    RequestClient.get(
      url,
      { uuid: this.state.uuid },
      res => {
        this.setState({
          message: res.content
        });
      },
      mes => {
        this.setState({
          retry: this.state.retry + 1
        });
        if (this.state.retry < 30) {
          setTimeout(() => {
            this.getResult();
          }, 1000);
        }
      }
    );
  };
  render() {
    const closeButton = (
      <Button onClick={this.hide}>
        <Close />
      </Button>
    );

    return (
      <span>
        <a
          className="button glyphicon glyphicon-check"
          onClick={this.show}
          title="Annotation-check"
        />

        <div>
          <Dialog
            open={this.state.formOpen}
            aria-labelledby="form-dialog-title"
          >
            <CardHeader action={closeButton} title="Annotation Check" />
            <DialogContent>
              <div style={{ marginTop: '15px' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={this.sendJob}
                >
                  <Send />
                  &nbsp;Check
                </Button>
              </div>
              <SnackbarContent
                message={this.state.message}
                style={{
                  marginTop: '15px',
                  whiteSpace: 'pre-line'
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </span>
    );
  }
}
