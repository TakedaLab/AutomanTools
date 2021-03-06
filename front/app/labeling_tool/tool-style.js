import orange from '@material-ui/core/colors/orange';
import red from '@material-ui/core/colors/red';
import blue from '@material-ui/core/colors/blue';
import green from '@material-ui/core/colors/green';
import grey from '@material-ui/core/colors/grey';


// toolbar status
export const appBarHeight = 54;
// sidebar status
export const drawerWidth = 160;
const labelListHeight = 200;
const listHead = 20;
export const toolStyle = theme => ({
  drawer: {
    width: drawerWidth,
    marginTop: appBarHeight,
    overflow: 'auto'
  },
  list: {
    overflow: 'auto',
    height: '100%',
    position: 'relative'
  },
  listHead: {
    backgroundColor: '#eee',
    color: '#000',
    height: listHead,
    lineHeight: listHead+'px'
  },
  listItem: {
    height: listHead
  },
  selectedListItem: {
    backgroundColor: '#eee',
  },
  listItemText: {
    whiteSpace: 'nowrap',
  },
  appBar: {
    width: '100%',
    height: appBarHeight,
  },
  appBarLeft: {
    display: 'flex',
    alignItems: 'center'
  },
  appBarRight: {
    textAlign: 'right'
  },
  gridContainer: {
    height: appBarHeight,
  },
  gridItem: {
    textAlign: 'center',
  },
  frameNumberParts: {
    color: '#000',
    backgroundColor: '#fff',
    borderRadius: 5,
    width: 260,
    marginLeft: 20
  },
  frameNumber: {
    width: 100,
    textAlign: 'center'
  },
  frameSkip: {
    width: 50
  },
  toolControlsWrapper: {
  },
  toolControls: {
    height: `calc(100vh - ${appBarHeight}px - ${labelListHeight}px)`,
    paddingBottom: '1rem',
    textAlign: 'center',
    overflowY: 'scroll',
  },
  activeTool: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)'
  },
  labelList: {
    height: labelListHeight,
    padding: 0,
  },
  klassSetList: {
    textAlign: 'center',
    margin: 'auto',
  },
  ClassSelect: {
    fontSize: '2rem',
    color: 'white',
  },
  colorIcon: {
    width: 18,
    height: 18,
    borderRadius: 2,
    marginRight: '1rem',
    display: 'inline-block',
  },
  content: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth*2}px)`,
    overflow: 'hidden'
  }
});
