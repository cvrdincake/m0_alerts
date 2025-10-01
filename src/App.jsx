import AlertBoxDisplay from './components/AlertBoxDisplay.jsx';
import StreamAlertBox from './components/StreamAlertBox.jsx';

const App = () => (
  <div className="relative min-h-screen">
    <StreamAlertBox />
    <AlertBoxDisplay />
  </div>
);

export default App;
